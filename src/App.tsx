import React, { useState, useEffect } from 'react';
import { AuthUser, Application, DriverProfile, Vehicle, DocumentRecord } from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { OtpVerifyForm } from './components/auth/OtpVerifyForm';
import { ProgressIndicator, OnboardingStepId } from './components/onboarding/ProgressIndicator';
import { PersonalStep } from './components/onboarding/PersonalStep';
import { IdentityStep } from './components/onboarding/IdentityStep';
import { VehicleStep } from './components/onboarding/VehicleStep';
import { DocumentsStep } from './components/onboarding/DocumentsStep';
import { ReviewStep } from './components/onboarding/ReviewStep';
import { SubmittedScreen } from './components/application/SubmittedScreen';
import { StatusScreen } from './components/application/StatusScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ApplicationReviewDetail } from './components/admin/ApplicationReviewDetail';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register' | 'otp-verify'>('login');
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    phone: string;
    demoOtp?: string;
  } | null>(null);

  // Driver state
  const [application, setApplication] = useState<Application | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>('personal');
  const [showStatusScreen, setShowStatusScreen] = useState(false);

  // Admin state
  const [selectedAdminAppId, setSelectedAdminAppId] = useState<string | null>(null);

  // Initial user fetch
  const fetchSessionAndAppData = async () => {
    try {
      setLoading(true);
      const userRes = await api.getCurrentUser();
      const user = userRes?.user || null;
      setCurrentUser(user);

      if (user?.role === 'driver') {
        const appRes = await api.getMyApplication();
        setApplication(appRes.application);
        setProfile(appRes.profile);
        setVehicle(appRes.vehicle);
        setDocuments(appRes.documents);

        if (appRes.application.status !== 'draft') {
          setShowStatusScreen(true);
        } else {
          setShowStatusScreen(false);
        }
      }
    } catch (err: any) {
      // Silently treat 401 / unauthorized as normal unauthenticated state
      if (err?.status !== 401 && !err?.message?.toLowerCase().includes('unauthorized')) {
        console.error('Session load error:', err);
      }
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndAppData();
  }, []);

  const handleLoginSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'driver') {
      const appRes = await api.getMyApplication();
      setApplication(appRes.application);
      setProfile(appRes.profile);
      setVehicle(appRes.vehicle);
      setDocuments(appRes.documents);

      if (appRes.application.status !== 'draft') {
        setShowStatusScreen(true);
      } else {
        setShowStatusScreen(false);
        setCurrentStep('personal');
      }
    }
  };

  const handleRegisterSuccess = (pending: {
    email: string;
    phone: string;
    demoOtp: string;
  }) => {
    setPendingVerification(pending);
    setAuthView('otp-verify');
  };

  const handleOtpVerified = async (user: AuthUser) => {
    setCurrentUser(user);
    setPendingVerification(null);
    const appRes = await api.getMyApplication();
    setApplication(appRes.application);
    setProfile(appRes.profile);
    setVehicle(appRes.vehicle);
    setDocuments(appRes.documents);
    setShowStatusScreen(false);
    setCurrentStep('personal');
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setApplication(null);
    setProfile(null);
    setVehicle(null);
    setDocuments([]);
    setSelectedAdminAppId(null);
    setAuthView('login');
  };

  const handleQuickSwitchUser = async (roleOrEmail: 'driver' | 'admin' | string, emailArg?: string) => {
    try {
      setLoading(true);
      const targetEmail = emailArg || (roleOrEmail === 'admin' ? 'admin@example.com' : roleOrEmail === 'driver' ? 'driver@example.com' : roleOrEmail);
      const res = await api.quickSwitch(targetEmail);
      setCurrentUser(res.user);
      setSelectedAdminAppId(null);

      if (res.user.role === 'driver') {
        const appRes = await api.getMyApplication();
        setApplication(appRes.application);
        setProfile(appRes.profile);
        setVehicle(appRes.vehicle);
        setDocuments(appRes.documents);

        if (appRes.application.status !== 'draft') {
          setShowStatusScreen(true);
        } else {
          setShowStatusScreen(false);
        }
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeView = !currentUser
    ? authView
    : currentUser.role === 'admin'
    ? 'admin'
    : showStatusScreen
    ? 'status'
    : 'onboarding';

  const handleSetActiveView = (view: string) => {
    if (view === 'login') {
      setAuthView('login');
    } else if (view === 'register') {
      setAuthView('register');
    } else if (view === 'status') {
      setShowStatusScreen(true);
    } else if (view === 'onboarding') {
      setShowStatusScreen(false);
    } else if (view === 'admin') {
      setSelectedAdminAppId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-800">Initializing Logiswift platform...</p>
          <p className="text-xs text-slate-500 mt-1">Checking session and database synchronization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        user={currentUser}
        onLogout={handleSignOut}
        onSignOut={handleSignOut}
        onQuickSwitch={(role, email) => {
          const targetEmail = email || (role === 'admin' ? 'admin@example.com' : 'driver@example.com');
          handleQuickSwitchUser(targetEmail);
        }}
        activeView={activeView}
        setActiveView={handleSetActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          /* Unauthenticated Auth Container */
          <div className="w-full flex items-center justify-center py-6">
            {authView === 'login' && (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onNavigateRegister={() => setAuthView('register')}
                onRequiresVerification={(data) => {
                  setPendingVerification(data);
                  setAuthView('otp-verify');
                }}
                onQuickSwitch={handleQuickSwitchUser}
              />
            )}

            {authView === 'register' && (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onNavigateLogin={() => setAuthView('login')}
              />
            )}

            {authView === 'otp-verify' && pendingVerification && (
              <OtpVerifyForm
                email={pendingVerification.email}
                phone={pendingVerification.phone}
                initialDemoOtp={pendingVerification.demoOtp}
                onSuccess={handleOtpVerified}
                onChangeContact={() => setAuthView('login')}
              />
            )}
          </div>
        ) : currentUser.role === 'admin' ? (
          /* Admin View */
          <div>
            {selectedAdminAppId ? (
              <ApplicationReviewDetail
                applicationId={selectedAdminAppId}
                onBack={() => setSelectedAdminAppId(null)}
                onApplicationUpdated={() => {}}
              />
            ) : (
              <AdminDashboard
                onSelectApplication={(id) => setSelectedAdminAppId(id)}
              />
            )}
          </div>
        ) : (
          /* Driver View */
          <div className="space-y-6">
            {/* If application is submitted or approved or rejected, render status or completion screen */}
            {showStatusScreen && application ? (
              application.status === 'submitted' ? (
                <SubmittedScreen
                  application={application}
                  onViewStatus={() => setShowStatusScreen(true)}
                  onSignOut={handleSignOut}
                />
              ) : (
                <StatusScreen
                  application={application}
                  profile={profile!}
                  vehicle={vehicle}
                  documents={documents}
                  onRefresh={fetchSessionAndAppData}
                />
              )
            ) : (
              /* Multi-step Driver Onboarding Flow */
              profile && (
                <div className="space-y-6">
                  {/* Step Progress Bar */}
                  <ProgressIndicator
                    currentStep={currentStep}
                    onStepClick={(step) => setCurrentStep(step)}
                    hasProfile={Boolean(profile.firstName && profile.residentialAddress)}
                    hasIdentity={Boolean(profile.nationalIdNumber && profile.driverLicenceNumber)}
                    hasVehicle={Boolean(vehicle?.vehicleType)}
                    hasDocuments={documents.length > 0}
                  />

                  {/* Step Form Switcher */}
                  {currentStep === 'personal' && (
                    <PersonalStep
                      initialProfile={profile}
                      onNext={(updated) => {
                        setProfile(updated);
                        setCurrentStep('identity');
                      }}
                      onSaveProgress={(updated) => setProfile(updated)}
                    />
                  )}

                  {currentStep === 'identity' && (
                    <IdentityStep
                      initialProfile={profile}
                      onNext={(updated) => {
                        setProfile(updated);
                        setCurrentStep('vehicle');
                      }}
                      onBack={() => setCurrentStep('personal')}
                      onSaveProgress={(updated) => setProfile(updated)}
                    />
                  )}

                  {currentStep === 'vehicle' && (
                    <VehicleStep
                      initialVehicle={vehicle}
                      onNext={(updated) => {
                        setVehicle(updated);
                        setCurrentStep('documents');
                      }}
                      onBack={() => setCurrentStep('identity')}
                      onSaveProgress={(updated) => setVehicle(updated)}
                    />
                  )}

                  {currentStep === 'documents' && (
                    <DocumentsStep
                      vehicleType={vehicle?.vehicleType || 'Car'}
                      initialDocuments={documents}
                      onNext={() => setCurrentStep('review')}
                      onBack={() => setCurrentStep('vehicle')}
                      onDocumentsUpdated={(updated) => setDocuments(updated)}
                    />
                  )}

                  {currentStep === 'review' && (
                    <ReviewStep
                      profile={profile}
                      vehicle={vehicle}
                      documents={documents}
                      onNavigateStep={(step) => setCurrentStep(step)}
                      onSubmitSuccess={(updatedApp) => {
                        setApplication(updatedApp);
                        setShowStatusScreen(true);
                      }}
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Logiswift Courier Logistics Inc. Driver Onboarding & Compliance Platform.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Backend Database Connected
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
