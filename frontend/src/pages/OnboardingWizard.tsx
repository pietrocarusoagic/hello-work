import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, UserProfile } from '../lib/api'
import ProfilePillar from '../components/ProfilePillar'

type WizardData = {
  role: string
  department: string
  officeLocation: string
  skills: string[]
  certifications: string[]
  aiTools: string[]
  aiDescription: string
  hobbies: string[]
  interests: string[]
}

const STEPS = ['Chi sei', 'Competenze', 'Setup AI', 'La persona']

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<WizardData>({
    role: '',
    department: '',
    officeLocation: '',
    skills: [],
    certifications: [],
    aiTools: [],
    aiDescription: '',
    hobbies: [],
    interests: [],
  })

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const addTag = (key: keyof WizardData, tag: string) => {
    const arr = data[key] as string[]
    if (!arr.includes(tag)) set(key, [...arr, tag] as WizardData[typeof key])
  }

  const removeTag = (key: keyof WizardData, tag: string) => {
    const arr = data[key] as string[]
    set(key, arr.filter((t) => t !== tag) as WizardData[typeof key])
  }

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await api.put<UserProfile>('/profiles/me', data)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-agic-dark flex flex-col items-center justify-start pt-10 px-4">
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between items-center mb-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`text-xs font-medium ${i <= step ? 'text-white' : 'text-white/30'}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="w-full h-1.5 bg-agic-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-agic transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1 text-right">
          {step + 1} / {STEPS.length}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-agic-card border border-agic-border rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-bold text-white">{STEPS[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Ruolo</label>
              <input
                value={data.role}
                onChange={(e) => set('role', e.target.value)}
                placeholder="es. Software Engineer"
                className="w-full text-sm bg-agic-dark border border-agic-border rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Dipartimento</label>
              <input
                value={data.department}
                onChange={(e) => set('department', e.target.value)}
                placeholder="es. Engineering"
                className="w-full text-sm bg-agic-dark border border-agic-border rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Sede</label>
              <select
                value={data.officeLocation}
                onChange={(e) => set('officeLocation', e.target.value)}
                className="w-full text-sm bg-agic-dark border border-agic-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-agic-primary/40"
              >
                <option value="">Seleziona sede…</option>
                <option value="Milano">Milano</option>
                <option value="Roma">Roma</option>
                <option value="Torino">Torino</option>
                <option value="Tirana">Tirana</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <ProfilePillar
              title="Competenze"
              icon="🧠"
              description="Le tue hard skill tecniche o di dominio"
              tags={data.skills}
              onAddTag={(t) => addTag('skills', t)}
              onRemoveTag={(t) => removeTag('skills', t)}
              inputPlaceholder="es. TypeScript"
            />
            <ProfilePillar
              title="Certificazioni"
              icon="🏅"
              description="Certificazioni professionali conseguite"
              tags={data.certifications}
              onAddTag={(t) => addTag('certifications', t)}
              onRemoveTag={(t) => removeTag('certifications', t)}
              inputPlaceholder="es. AZ-900"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <ProfilePillar
              title="Strumenti AI"
              icon="🤖"
              description="Tool AI che usi regolarmente"
              tags={data.aiTools}
              onAddTag={(t) => addTag('aiTools', t)}
              onRemoveTag={(t) => removeTag('aiTools', t)}
              inputPlaceholder="es. GitHub Copilot"
            />
            <div>
              <label className="text-xs text-white/50 mb-1 block">Come usi l'AI nel tuo lavoro?</label>
              <textarea
                value={data.aiDescription}
                onChange={(e) => set('aiDescription', e.target.value)}
                rows={3}
                placeholder="Descrivi brevemente come integri l'AI nel tuo workflow…"
                className="w-full text-sm bg-agic-dark border border-agic-border rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40 resize-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ProfilePillar
              title="Hobby"
              icon="🎯"
              description="Cosa fai nel tempo libero?"
              tags={data.hobbies}
              onAddTag={(t) => addTag('hobbies', t)}
              onRemoveTag={(t) => removeTag('hobbies', t)}
              inputPlaceholder="es. Arrampicata"
            />
            <ProfilePillar
              title="Interessi"
              icon="✨"
              description="Temi che ti appassionano"
              tags={data.interests}
              onAddTag={(t) => addTag('interests', t)}
              onRemoveTag={(t) => removeTag('interests', t)}
              inputPlaceholder="es. Filosofia"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <button
            onClick={advance}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Salta
          </button>
          <button
            onClick={advance}
            disabled={saving}
            className="px-6 py-2 bg-gradient-agic text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Salvataggio…' : step < STEPS.length - 1 ? 'Avanti →' : 'Completa ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
