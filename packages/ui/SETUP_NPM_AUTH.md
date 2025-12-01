# Setting Up Long-Term NPM Authentication

## Option 1: Automation Token (Recommended - Non-Interactive)

### Step 1: Create Token
1. Go to: https://www.npmjs.com/settings/unicornlove/tokens
2. Click "Generate New Token"
3. Type: **Automation**
4. Expiration: 90 days (or custom)
5. Scopes: `read:packages`, `write:packages`
6. Click "Generate Token"
7. **Copy the token immediately** (you won't see it again)

### Step 2: Add to ~/.npmrc
```bash
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc
chmod 600 ~/.npmrc  # Secure the file
```

### Step 3: Verify
```bash
npm whoami
# Should show your username
```

**Benefits:**
- ✅ No interactive prompts
- ✅ Works in CI/CD
- ✅ Can be rotated easily
- ✅ More secure than password auth

## Option 2: npm login (Interactive, Cached)

```bash
npm login
# Follow prompts, credentials cached in ~/.npmrc
```

**Benefits:**
- ✅ Simple one-time setup
- ✅ Credentials cached locally
- ❌ Requires interactive session
- ❌ May expire

## Option 3: Environment Variable (For CI/CD)

```bash
export NPM_TOKEN=your_token_here
npm publish --tag alpha --access public
```

**Benefits:**
- ✅ Good for CI/CD
- ✅ No file changes needed
- ❌ Not persistent across sessions

## Recommended Approach

For local development: **Option 1 (Automation Token)**
- Add token to `~/.npmrc`
- Never prompts again
- Works for all npm commands

For CI/CD: **Option 3 (Environment Variable)**
- Store token as GitHub secret
- Use in GitHub Actions workflows

