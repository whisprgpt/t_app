import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { supabase } from '../lib/supabase/client'

export default function Auth() {
  // Set up listener for deep link callbacks
  useEffect(() => {
    const setupListener = async () => {
      // Listen for 'auth-callback' event from Rust
      const unlisten = await listen('auth-callback', async (event: any) => {
        console.log('🔥 Received auth callback from Rust:', event.payload)
        
        const code = event.payload.code
        
        if (code) {
          console.log('🔄 Exchanging code for session...')
          
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
              console.error('❌ Failed to exchange code:', error)
              alert('Login failed: ' + error.message)
            } else {
              console.log('✅ Session established!', data.session)
              console.log('✅ User:', data.user?.email)
              
              // Redirect to dashboard or update state
              window.location.href = '/#/dashboard'
            }
          } catch (err) {
            console.error('❌ Exception during code exchange:', err)
          }
        }
      })
      
      return unlisten
    }
    
    const unlistenPromise = setupListener()
    
    return () => {
      unlistenPromise.then(fn => fn())
    }
  }, [])

  const handleGoogleLogin = async () => {
    console.log('🔗 Starting Google OAuth...')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'whisprgpt://callback',  // ✅ Deep link
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ OAuth error:', error)
        alert('OAuth error: ' + error.message)
        return
      }

      if (data?.url) {
        console.log('🔗 OAuth URL generated:', data.url)
        
        // Verify redirect_to parameter
        if (data.url.includes('redirect_to=whisprgpt')) {
          console.log('✅ redirect_to parameter is correct')
        } else {
          console.warn('⚠️ redirect_to parameter missing or incorrect!')
        }
        
        // Open in external browser
        await invoke('open_external_url', { url: data.url })
        console.log('✅ Opened OAuth URL in browser')
      }
    } catch (err) {
      console.error('❌ Exception during OAuth:', err)
      alert('Error: ' + err)
    }
  }

  return (
    <div className="auth-container">
      <h1>Welcome to WhisprGPT</h1>
      <button 
        onClick={handleGoogleLogin}
        className="google-login-btn"
      >
        Sign in with Google
      </button>
    </div>
  )
}