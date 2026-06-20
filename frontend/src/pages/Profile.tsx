import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, UserProfile } from '../lib/api'
import ProfilePillar from '../components/ProfilePillar'
import ProfileCompleteness from '../components/ProfileCompleteness'

export default function Profile() {
  const { id } = useParams()
  const isOwnProfile = !id
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const path = isOwnProfile ? '/profiles/me' : `/profiles/${id}`
    api.get<UserProfile>(path)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, isOwnProfile])

  const updateProfile = (updater: (current: UserProfile) => UserProfile) => {
    setProfile((current) => current ? updater(current) : current)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await api.put('/profiles/me', profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Caricamento...</div>
  if (!profile) return null

  return (
    <div className="min-h-screen pb-20 md:pt-20 max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.displayName} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
            {profile.displayName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-800">{profile.displayName}</h1>
          <p className="text-gray-500 text-sm">{profile.role} {profile.department ? `— ${profile.department}` : ''}</p>
          <p className="text-gray-400 text-xs">{profile.officeLocation}</p>
        </div>
      </div>

      {isOwnProfile && <div className="mb-4"><ProfileCompleteness score={profile.profileScore} /></div>}

      <div className="space-y-4">
        <ProfilePillar
          title="Pilastro Professionale"
          icon="💼"
          description="Le tue competenze tecniche e certificazioni"
          tags={profile.skills}
          onAddTag={(t) => updateProfile((current) => ({ ...current, skills: [...current.skills, t] }))}
          onRemoveTag={(t) => updateProfile((current) => ({ ...current, skills: current.skills.filter((s) => s !== t) }))}
          inputPlaceholder="Es. TypeScript, Azure, Scrum…"
        />

        <ProfilePillar
          title="Pilastro Agentic"
          icon="🤖"
          description="Gli strumenti AI che utilizzi quotidianamente"
          tags={profile.aiTools}
          onAddTag={(t) => updateProfile((current) => ({ ...current, aiTools: [...current.aiTools, t] }))}
          onRemoveTag={(t) => updateProfile((current) => ({ ...current, aiTools: current.aiTools.filter((s) => s !== t) }))}
          inputPlaceholder="Es. Claude, Copilot, n8n, LangChain…"
        />

        <ProfilePillar
          title="Pilastro Umano"
          icon="❤️"
          description="I tuoi hobby e interessi personali"
          tags={[...profile.hobbies, ...profile.interests]}
          onAddTag={(t) => updateProfile((current) => ({ ...current, hobbies: [...current.hobbies, t] }))}
          onRemoveTag={(t) => updateProfile((current) => ({
            ...current,
            hobbies: current.hobbies.filter((s) => s !== t),
            interests: current.interests.filter((s) => s !== t),
          }))}
          inputPlaceholder="Es. Fotografia, Running, Jazz…"
        />
      </div>

      {isOwnProfile && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saved ? '✅ Salvato!' : saving ? 'Salvataggio…' : 'Salva Profilo'}
        </button>
      )}
    </div>
  )
}
