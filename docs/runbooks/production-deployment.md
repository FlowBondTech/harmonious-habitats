# Production Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying the Holistic Wellness Platform to production.

## Pre-Deployment Checklist

### 1. Code Review
- [ ] All PRs approved by at least one reviewer
- [ ] No merge conflicts with main branch
- [ ] All conversations resolved

### 2. Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA testing completed
- [ ] Performance benchmarks met

### 3. Security
- [ ] Security scan completed (npm audit)
- [ ] No high or critical vulnerabilities
- [ ] Environment variables reviewed
- [ ] API keys rotated if needed

### 4. Database
- [ ] Migration scripts reviewed
- [ ] Rollback scripts prepared
- [ ] Database backup created
- [ ] RLS policies tested

## Deployment Steps

### Step 1: Prepare Release
```bash
# 1. Checkout main branch
git checkout main
git pull origin main

# 2. Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. Verify build locally
npm run build
npm run preview
```

### Step 2: Database Migration
```bash
# 1. Backup production database
# (This is automatic in Supabase, but verify)

# 2. Run migrations via Supabase Dashboard
# - Go to SQL Editor
# - Run each migration in order
# - Verify successful execution

# 3. Test critical queries
# - Check user authentication
# - Verify event queries
# - Test notification triggers
```

### Step 3: Deploy Application
```bash
# Automatic deployment via GitHub Actions
# 1. Push to main triggers deployment
git push origin main

# 2. Monitor GitHub Actions
# - Check https://github.com/[repo]/actions
# - Verify all steps pass

# 3. Vercel deployment
# - Automatic via GitHub integration
# - Check Vercel dashboard for status
```

### Step 4: Post-Deployment Verification

#### 4.1 Health Checks
- [ ] Application loads successfully
- [ ] Login/logout working
- [ ] Database connections active
- [ ] Real-time subscriptions working

#### 4.2 Critical Path Testing
- [ ] User registration flow
- [ ] Event creation and RSVP
- [ ] Space booking process
- [ ] Messaging system
- [ ] Notification delivery

#### 4.3 Performance Verification
- [ ] Page load time <3 seconds
- [ ] API response time <200ms
- [ ] No console errors
- [ ] Proper error handling

### Step 5: Monitoring Setup
```bash
# 1. Check Vercel Analytics
# - Verify tracking is active
# - Check for any errors

# 2. Database Monitoring
# - Check Supabase dashboard
# - Verify query performance
# - Monitor connection pool

# 3. Error Tracking
# - Set up error alerts
# - Configure threshold alerts
```

## Rollback Procedure

### Immediate Rollback (< 5 minutes)
1. **Vercel Instant Rollback**
   - Go to Vercel dashboard
   - Select previous deployment
   - Click "Promote to Production"

### Database Rollback
1. **Run rollback migrations**
   ```sql
   -- Each migration should have a corresponding rollback
   -- Run in reverse order
   ```

2. **Restore from backup if needed**
   - Use Supabase point-in-time recovery
   - Restore to timestamp before deployment

### Full Rollback
1. Revert code changes
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Rollback database
3. Clear caches
4. Notify team

## Communication Plan

### Pre-Deployment
- [ ] Notify team in Slack/Discord
- [ ] Update status page
- [ ] Send user notification (if downtime expected)

### During Deployment
- [ ] Update deployment channel with progress
- [ ] Monitor for any issues
- [ ] Be ready to rollback

### Post-Deployment
- [ ] Announce successful deployment
- [ ] Share any known issues
- [ ] Update documentation
- [ ] Schedule retrospective

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm run build
```

#### Database Connection Issues
- Check Supabase service status
- Verify environment variables
- Check connection pool limits
- Review RLS policies

#### Performance Issues
- Check Vercel function logs
- Review database slow queries
- Verify CDN configuration
- Check for memory leaks

## Emergency Contacts

- **On-Call Engineer**: [Phone/Slack]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]
- **Product Owner**: [Contact]

## Post-Deployment Tasks

### Within 1 Hour
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Review user feedback

### Within 24 Hours
- [ ] Send deployment summary
- [ ] Update release notes
- [ ] Close related issues/tickets
- [ ] Plan any hotfixes needed

### Within 1 Week
- [ ] Conduct retrospective
- [ ] Update runbooks
- [ ] Document lessons learned
- [ ] Plan next release

---

**Last Updated**: 2025-01-18
**Version**: 1.0
**Owner**: DevOps Team