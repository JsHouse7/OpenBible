'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/components/AuthProvider'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  BookOpen, 
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function SupabaseAuthPage() {
  const router = useRouter()
  const { user, signIn, signUp, resetPassword, loading: authLoading } = useAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState<string | null>(null)

  // Form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await signIn(loginData.email, loginData.password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email and click the confirmation link before signing in.' })
        } else {
          setErrors({ general: error.message || 'An error occurred during sign in.' })
        }
      } else {
        setSuccess('Successfully signed in! Redirecting...')
        setTimeout(() => router.push('/'), 1500)
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerData.agreeToTerms) {
      setErrors({ general: 'Please agree to the Terms of Service and Privacy Policy' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await signUp(registerData.email, registerData.password, registerData.name)
      
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ general: 'This email is already registered. Try signing in instead.' })
        } else if (error.message.includes('Password should be')) {
          setErrors({ password: error.message })
        } else {
          setErrors({ general: error.message || 'An error occurred during registration.' })
        }
      } else {
        setSuccess('Account created successfully! Please check your email for confirmation.')
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrors({})
    setSuccess(null)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">OpenBible</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to access your Bible study dashboard'
                : 'Join thousands of believers in their digital Bible study journey'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(errors.general || success) && (
              <Alert variant={errors.general ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general || success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={isLogin ? loginData.email : registerData.email}
                  onChange={(e) => {
                    if (isLogin) {
                      setLoginData({...loginData, email: e.target.value})
                    } else {
                      setRegisterData({...registerData, email: e.target.value})
                    }
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={isLogin ? loginData.password : registerData.password}
                    onChange={(e) => {
                      if (isLogin) {
                        setLoginData({...loginData, password: e.target.value})
                      } else {
                        setRegisterData({...registerData, password: e.target.value})
                      }
                    }}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="agreeToTerms"
                    checked={registerData.agreeToTerms}
                    onCheckedChange={(checked) => 
                      setRegisterData({...registerData, agreeToTerms: checked as boolean})
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm font-normal leading-5">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-muted-foreground text-sm">or</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <Button variant="ghost" type="button" onClick={toggleMode} className="font-medium" disabled={isLoading}>
                {isLogin ? 'Create new account' : 'Sign in instead'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 