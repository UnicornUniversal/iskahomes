# Google Maps API Configuration Guide

## Issue: Autocomplete Not Working for Business Names

If you can search "Unicorn Universal" on Google Maps but not in your application, follow these steps:

---

## ✅ Step 1: Enable Required APIs

Go to: [Google Cloud Console - API Library](https://console.cloud.google.com/apis/library)

Enable these APIs (if not already enabled):

1. **Places API (New)** ⭐ Most Important
   - Search: "Places API (New)"
   - Click "Enable"

2. **Maps JavaScript API**
   - Search: "Maps JavaScript API"
   - Click "Enable"

3. **Geocoding API**
   - Search: "Geocoding API"
   - Click "Enable"

4. **Places API** (Legacy - still needed)
   - Search: "Places API"
   - Click "Enable"

---

## ✅ Step 2: Configure API Key Restrictions

Go to: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

1. Click on your API key (the one in `NEXT_PUBLIC_GOOGLE_MAPS_API`)

2. **API Restrictions Section:**
   - Select "Restrict key"
   - Check these APIs:
     - ✅ Places API (New)
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API

3. **Application Restrictions Section:**
   - If testing locally: Select "None"
   - If in production: Set "HTTP referrers" and add your domains:
     - `localhost:*`
     - `*.vercel.app/*` (if using Vercel)
     - `yourdomain.com/*`

4. Click **"Save"**

---

## ✅ Step 3: Check API Key in Environment Variables

Make sure your `.env.local` file has the correct API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API=YOUR_ACTUAL_API_KEY_HERE
```

**Important:**
- No quotes around the key
- No spaces
- Must start with `NEXT_PUBLIC_` for Next.js client-side access
- Restart your dev server after changing this

---

## ✅ Step 4: Enable Billing (Required)

Google Maps APIs require billing to be enabled, even with the free tier:

1. Go to: [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Link a billing account to your project
3. You get **$200 free credit per month**
4. Most apps stay within the free tier

**Free Tier Limits (per month):**
- Places Autocomplete: First 1,000 requests free, then $2.83 per 1,000
- Places Details: First 1,000 requests free, then $17 per 1,000
- Maps JavaScript: 28,000 map loads free per month

---

## ✅ Step 5: Test the Configuration

After making changes above:

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. **Restart your development server**
3. **Open browser console** (F12)
4. **Try searching** "Unicorn Universal"
5. **Check console logs** for:
   - ✅ "Found results with establishment search"
   - ❌ Error messages or API key issues

---

## 🐛 Troubleshooting

### Error: "This API key is not authorized to use this service or API"

**Solution:**
- Go to API restrictions in your key settings
- Make sure all 4 APIs listed in Step 2 are enabled
- Wait 5-10 minutes for changes to propagate
- Clear browser cache

### Error: "REQUEST_DENIED"

**Solution:**
- Check that billing is enabled
- Verify API key is correct in `.env.local`
- Check API restrictions aren't too strict
- Make sure the referrer/domain is allowed

### No results for businesses but addresses work

**Solution:**
- This is what we just fixed in the code!
- The new code tries 3 different search strategies:
  1. Establishment search (for businesses)
  2. Geocode search (for addresses)
  3. Broad search (everything)

### Still not working?

**Check console logs:**
- Look for the emoji logs: ✅, ⚠️, ❌
- They'll tell you which strategy is being tried
- Copy any error messages

**Common issues:**
- API key in wrong format
- Forgot to restart dev server
- Browser cache not cleared
- Billing not enabled
- API not enabled in Cloud Console

---

## 📊 Monitoring API Usage

Track your usage to stay within free limits:

1. Go to: [Google Cloud Console - APIs Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Click on each API to see usage graphs
3. Set up alerts if you're approaching limits

---

## 💡 Pro Tips

1. **Use autocomplete sessionToken** to reduce costs (future optimization)
2. **Cache results** on your backend to avoid repeated API calls
3. **Restrict API key** by HTTP referrer in production
4. **Monitor usage** regularly to avoid surprise charges
5. **Test with different place types**: businesses, addresses, landmarks

---

## 🔍 What Changed in the Code

The autocomplete now uses **3 fallback strategies**:

```javascript
// Strategy 1: Businesses (Unicorn Universal, KFC, etc.)
types: ['establishment']

// Strategy 2: Addresses (123 Main St, East Legon, etc.)
types: ['geocode']

// Strategy 3: Everything (broadest search)
No type restriction
```

This ensures you get results for:
- ✅ Business names
- ✅ Street addresses
- ✅ Neighborhoods
- ✅ Landmarks
- ✅ Cities and regions

---

## ✅ Checklist

Before testing, make sure you've done ALL of these:

- [ ] Enabled Places API (New) in Google Cloud Console
- [ ] Enabled Maps JavaScript API
- [ ] Enabled Geocoding API
- [ ] Enabled Places API (Legacy)
- [ ] Configured API key restrictions properly
- [ ] Added API key to `.env.local` file
- [ ] Enabled billing on Google Cloud project
- [ ] Restarted development server
- [ ] Cleared browser cache
- [ ] Opened browser console to see logs

---

## 📧 Need More Help?

If you've followed all steps and it's still not working:

1. Check the browser console for detailed error messages
2. Copy the exact error message
3. Check your API key usage in Google Cloud Console
4. Verify the API key is correct and has no typos
5. Test with a simple address first (like "Accra") to isolate the issue

---

**Last Updated:** October 2025

