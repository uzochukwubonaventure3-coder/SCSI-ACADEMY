# Deployment Fixes - Nodemailer & Validation Issues

## 🔍 Root Cause Analysis

### Issue 1: 400 Validation Error on `/api/refinery`
**Problem:** The frontend was receiving a 400 error when submitting the refinery registration form.

**Root Causes Identified:**
1. **FRONTEND_URL had a leading space** in `.env` file: ` FRONTEND_URL=scsiacademy.info`
   - This caused the URL to be invalid
   - Also missing `https://` protocol

2. **Insufficient error logging** made it difficult to debug validation failures
   - The validate middleware wasn't logging what specific fields failed validation
   - The refinery route wasn't logging received data

**Solutions Applied:**
1. ✅ Fixed `FRONTEND_URL` in `backend/.env`:
   ```env
   # Before:
    FRONTEND_URL=scsiacademy.info
   
   # After:
   FRONTEND_URL=https://scsiacademy.info
   ```

2. ✅ Enhanced logging in `backend/src/middleware/validate.ts`:
   - Now logs validation errors with path, method, and received body
   - Shows exactly which fields failed validation

3. ✅ Added detailed logging in `backend/src/routes/refinery.ts`:
   - Logs all received registration data
   - Helps identify if data is reaching the server correctly

4. ✅ Added email notification to refinery registration:
   - Now sends admin notification when someone registers (if email is provided)
   - Non-blocking to avoid slowing down the response

### Issue 2: Nodemailer Not Working After Deployment
**Problem:** Email notifications stopped working after deploying backend to Railway.

**Root Causes:**
1. **Gmail SMTP restrictions** - Gmail has strict security policies that may block:
   - Sign-in attempts from Railway's IP addresses
   - Automated emails from App Passwords
   - Emails flagged as suspicious activity

2. **Environment variables not set in Railway** - Railway doesn't read `.env` files automatically
   - Must set environment variables in Railway Dashboard → Settings → Variables

**Current Email Configuration:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=uzochukwubonaventure3@gmail.com
EMAIL_PASS=yaljhpwkfulxyuay  # Gmail App Password
EMAIL_FROM=SCSI Academy <uzochukwubonaventure3@gmail.com>
```

## 🚀 Action Steps

### Step 1: Set Environment Variables in Railway
1. Go to your Railway project dashboard
2. Navigate to your backend service
3. Click on "Variables" tab
4. Add these environment variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=uzochukwubonaventure3@gmail.com
   EMAIL_PASS=yaljhpwkfulxyuay
   EMAIL_FROM=SCSI Academy <uzochukwubonaventure3@gmail.com>
   FRONTEND_URL=https://scsiacademy.info
   ```

### Step 2: Verify Gmail Account Settings
1. Ensure 2FA is enabled on your Gmail account
2. Verify the App Password is correct (regenerate if needed)
3. Check Gmail for any security alerts or blocked sign-in attempts

### Step 3: Test the Deployment
1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Test the refinery endpoint:**
   - Submit a test registration through the frontend
   - Check Railway logs for validation errors
   - Look for `[Refinery] Received registration:` in logs

3. **Test email functionality:**
   - Check logs for `[EMAIL SENT]` or `[EMAIL FAILED]` messages
   - If emails fail, you'll see detailed error messages

### Step 4: If Gmail Continues to Fail (Recommended Long-term Solution)
Switch to a professional email service designed for transactional emails:

#### Option A: Resend (Easiest - Free 3,000 emails/month)
```bash
npm install resend
```
Update `backend/src/utils/email.ts` to use Resend API.

#### Option B: SendGrid (Free 100 emails/day)
```bash
npm install @sendgrid/mail
```

#### Option C: Brevo/Sendinblue (Free 300 emails/day)
```bash
npm install @getbrevo/brevo
```

## 📊 Monitoring & Debugging

### Check Validation Errors
Look for these log patterns in Railway:
```
[Validation Error] {
  path: '/api/refinery',
  method: 'POST',
  errors: ['fieldName: error message'],
  receivedBody: '{...}'
}
```

### Check Email Status
```
[EMAIL SKIP] No credentials. Subject: ...
[EMAIL SENT] Subject → email@example.com
[EMAIL FAILED] Subject → email@example.com: error details
```

### Check Refinery Registrations
```
[Refinery] Received registration: { fullName, levelOrProfession, ... }
[Refinery] Failed to send email notification: error
```

## ✅ Verification Checklist

- [ ] Environment variables set in Railway Dashboard
- [ ] Gmail 2FA enabled and App Password verified
- [ ] Test registration submitted successfully (no 400 error)
- [ ] Email notifications working (check logs for `[EMAIL SENT]`)
- [ ] FRONTEND_URL correctly set to `https://scsiacademy.info`
- [ ] Validation errors properly logged if they occur

## 🆘 If Issues Persist

1. **Still getting 400 errors?**
   - Check Railway logs for `[Validation Error]` messages
   - Verify frontend is sending data in correct format
   - Check that `preferredSession` is exactly "Morning Cohort" or "Evening Cohort"

2. **Emails still not working?**
   - Check Gmail for security alerts
   - Try regenerating the Gmail App Password
   - Consider switching to Resend/SendGrid for better deliverability

3. **Need help debugging?**
   - Share the Railway logs (look for error patterns)
   - Check the specific validation error messages
   - Verify all environment variables are set correctly in Railway

## 📝 Changes Made

### Files Modified:
1. `backend/.env` - Fixed FRONTEND_URL (removed space, added https)
2. `backend/src/routes/refinery.ts` - Added logging and email notification
3. `backend/src/middleware/validate.ts` - Enhanced error logging

### Files to Update (if switching email provider):
- `backend/src/utils/email.ts` - Replace Nodemailer with new provider
- `backend/package.json` - Add new email provider package

---

**Next Steps:** Deploy these changes to Railway and test the refinery registration form. Check the logs to verify everything is working correctly.