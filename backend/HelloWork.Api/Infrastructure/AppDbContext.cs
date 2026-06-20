using HelloWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HelloWork.Api.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<WorkMatchSwipe> WorkMatchSwipes => Set<WorkMatchSwipe>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.AadOid)
            .IsUnique();

        modelBuilder.Entity<WorkMatchSwipe>()
            .HasIndex(s => new { s.SwiperId, s.TargetId })
            .IsUnique();

        // SQL Server non consente cascade multipli sulla stessa tabella.
        // WorkMatchSwipes ha due FK verso Users (SwiperId, TargetId) → entrambe NoAction.
        modelBuilder.Entity<WorkMatchSwipe>()
            .HasOne(s => s.Swiper)
            .WithMany()
            .HasForeignKey(s => s.SwiperId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkMatchSwipe>()
            .HasOne(s => s.Target)
            .WithMany()
            .HasForeignKey(s => s.TargetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GroupMember>()
            .HasKey(gm => new { gm.GroupId, gm.UserId });

        modelBuilder.Entity<Group>()
            .HasMany(g => g.Members)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId);

        modelBuilder.Entity<GroupMember>()
            .HasOne(gm => gm.User)
            .WithMany()
            .HasForeignKey(gm => gm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Match>()
            .HasOne(m => m.UserA)
            .WithMany()
            .HasForeignKey(m => m.UserAId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Match>()
            .HasOne(m => m.UserB)
            .WithMany()
            .HasForeignKey(m => m.UserBId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
