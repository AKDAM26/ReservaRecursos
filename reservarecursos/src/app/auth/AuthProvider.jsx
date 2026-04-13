import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { supabase } from '../../lib/supabaseClient'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  const value = useMemo(() => {
    const user = session?.user && profile ? {
      id: session.user.id,
      email: session.user.email,
      role: profile.role,
      displayName: profile.display_name,
    } : null

    return {
      user,
      isAuthenticated: Boolean(user),
      loading,
      login: async ({ email, password }) => {
        if (!email || !password) throw new Error('Completa email y contraseña.')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Fix "Double Login": Esperar a tener el profile en Context antes de navegar.
        if (data?.session?.user) {
          await fetchProfile(data.session.user.id)
        }
      },
      register: async ({ email, password, department_id, display_name }) => {
        if (!email || !password) throw new Error('Completa email y contraseña.')
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
        
        // Supabase maneja la validación de dominio @educa.madrid.org en el trigger
        // pero incluimos un check sencillo en el FE para feedback más rápido
        const normalized = email.trim().toLowerCase()
        const domainOk = normalized.endsWith('@educa.madrid.org')
        if (!domainOk) throw new Error('Solo se permite correo @educa.madrid.org.')

        const { data, error } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: {
            data: {
              department_id,
              display_name
            }
          }
        })
        if (error) throw error
        
        // Fix "Double Login" equivalente durante el registro automático de Supabase
        if (data?.session?.user) {
          await fetchProfile(data.session.user.id)
        }
      },
      logout: async () => {
        await supabase.auth.signOut()
      },
    }
  }, [session, profile, loading])

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
