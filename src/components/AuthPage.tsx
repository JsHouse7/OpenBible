'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  BookOpen, 
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface AuthPageProps {
  onLogin?: (email: string, password: string) => Promise<boolean>
  onRegister?: (userData: RegisterData) => Promise<boolean>
  onNavigate?: (page: string) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  agreeToTerms: boolean
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

const AuthPage = ({ onLogin, onRegister, onNavigate }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const validateLoginForm = () => {
    const newErrors: FormErrors = {}

    if (!loginData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors: FormErrors = {}

    if (!registerData.name) {
      newErrors.name = 'Name is required'
    } else if (registerData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!registerData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!registerData.password) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(registerData.password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLoginForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      if (onLogin) {
        const success = await onLogin(loginData.email, loginData.password)
        if (success) {
          setSuccess(true)
          // Navigate to dashboard or home after successful login
          setTimeout(() => onNavigate?.('dashboard'), 1000)
        } else {
          setErrors({ general: 'Invalid email or password. Please try again.' })
        }
      } else {
        // Demo mode - simulate successful login
        setTimeout(() => {
          setSuccess(true)
          setTimeout(() => onNavigate?.('dashboard'), 1000)
        }, 1000)
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateRegisterForm()) return

    if (!registerData.agreeToTerms) {
      setErrors({ general: 'Please agree to the Terms of Service and Privacy Policy' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const userData: RegisterData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        agreeToTerms: registerData.agreeToTerms
      }

      if (onRegister) {
        const success = await onRegister(userData)
        if (success) {
          setSuccess(true)
          setTimeout(() => onNavigate?.('dashboard'), 1000)
        } else {
          setErrors({ general: 'Registration failed. Email might already be in use.' })
        }
      } else {
        // Demo mode - simulate successful registration
        setTimeout(() => {
          setSuccess(true)
          setTimeout(() => onNavigate?.('dashboard'), 1000)
        }, 1000)
      }
    } catch (error) {
      setErrors({ general: 'An error occurred during registration. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrors({})
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome to OpenBible!</h2>
                <p className="text-muted-foreground mt-2">
                  {isLogin ? 'Successfully logged in.' : 'Account created successfully.'} Redirecting to your dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">OpenBible</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Main Card */}
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
            {/* Error Alert */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {/* Registration-only fields */}
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
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
              )}

              {/* Email field */}
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
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Password field */}
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
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                {!isLogin && !errors.password && (
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
                )}
              </div>

              {/* Confirm Password (Registration only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Remember Me / Terms */}
              <div className="space-y-3">
                {isLogin ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) => 
                        setLoginData({...loginData, rememberMe: checked as boolean})
                      }
                    />
                    <Label htmlFor="rememberMe" className="text-sm font-normal">
                      Remember me for 30 days
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="agreeToTerms"
                      checked={registerData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setRegisterData({...registerData, agreeToTerms: checked as boolean})
                      }
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm font-normal leading-5">
                      I agree to the{' '}
                      <button type="button" className="text-blue-600 hover:underline">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="text-center">
                <button className="text-sm text-blue-600 hover:underline">
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Separator */}
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-muted-foreground text-sm">or</span>
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <Button variant="ghost" type="button" onClick={toggleMode} className="font-medium">
                {isLogin ? 'Create new account' : 'Sign in instead'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By continuing, you acknowledge that you have read and understood our</p>
          <div className="flex justify-center space-x-4 mt-1">
            <button className="hover:underline">Terms of Service</button>
            <span>•</span>
            <button className="hover:underline">Privacy Policy</button>
            <span>•</span>
            <button className="hover:underline">Cookie Policy</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage 