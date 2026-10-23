import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingPage } from '@/pages/LandingPage';
import { BusResultsPage } from '@/pages/bus/BusResultsPage';
import { BusBookingPage } from '@/pages/bus/BusBookingPage';
import { BusReviewPage } from '@/pages/bus/BusReviewPage';
import { CheckoutPage } from '@/pages/shared/CheckoutPage';
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';
import { FerryResultsPage } from '@/pages/ferry/FerryResultsPage';
import { FerryBookingPage } from '@/pages/ferry/FerryBookingPage';
import { FerryReviewPage } from '@/pages/ferry/FerryReviewPage';
import { FlightResultsPage } from '@/pages/flights/FlightResultsPage';
import { FlightBookingPage } from '@/pages/flights/FlightBookingPage';
import { FlightReviewPage } from '@/pages/flights/FlightReviewPage';
import { TrainResultsPage } from '@/pages/train/TrainResultsPage';
import { TrainBookingPage } from '@/pages/train/TrainBookingPage';
import { TrainReviewPage } from '@/pages/train/TrainReviewPage';
import { StaysResultsPage } from '@/pages/stays/StaysResultsPage';
import { StaysDetailPage } from '@/pages/stays/StaysDetailPage';
import { StaysReviewPage } from '@/pages/stays/StaysReviewPage';
import { ExperiencesResultsPage } from '@/pages/experiences/ExperiencesResultsPage';
import { ExperiencesDetailPage } from '@/pages/experiences/ExperiencesDetailPage';
import { ExperiencesReviewPage } from '@/pages/experiences/ExperiencesReviewPage';
import { SignInPage } from '@/pages/account/SignInPage';
import { RegisterPage } from '@/pages/account/RegisterPage';
import { ManageBookingPage } from '@/pages/account/ManageBookingPage';
import { DashboardPage } from '@/pages/account/DashboardPage';
import { BusOperatorDashboardPage } from '@/pages/operator/BusOperatorDashboardPage';
import { FerryOperatorDashboardPage } from '@/pages/operator/FerryOperatorDashboardPage';
import { HelpPage } from '@/pages/info/HelpPage';
import { InfoPage } from '@/pages/info/InfoPage';
import { PartnersPage } from '@/pages/info/PartnersPage';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
      <I18nProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route path="/bus/results" element={<BusResultsPage />} />
              <Route path="/bus/booking" element={<BusBookingPage />} />
              <Route path="/bus/review" element={<BusReviewPage />} />

              <Route path="/ferry/results" element={<FerryResultsPage />} />
              <Route path="/ferry/booking" element={<FerryBookingPage />} />
              <Route path="/ferry/review" element={<FerryReviewPage />} />

              <Route path="/flights/results" element={<FlightResultsPage />} />
              <Route path="/flights/booking" element={<FlightBookingPage />} />
              <Route path="/flights/review" element={<FlightReviewPage />} />

              <Route path="/train/results" element={<TrainResultsPage />} />
              <Route path="/train/booking" element={<TrainBookingPage />} />
              <Route path="/train/review" element={<TrainReviewPage />} />

              <Route path="/stays/results" element={<StaysResultsPage />} />
              <Route path="/stays/detail" element={<StaysDetailPage />} />
              <Route path="/stays/review" element={<StaysReviewPage />} />

              <Route path="/experiences/results" element={<ExperiencesResultsPage />} />
              <Route path="/experiences/detail" element={<ExperiencesDetailPage />} />
              <Route path="/experiences/review" element={<ExperiencesReviewPage />} />

              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />

              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/manage-booking" element={<ManageBookingPage />} />
              <Route path="/operator/bus" element={<BusOperatorDashboardPage />} />
              <Route path="/operator/ferry" element={<FerryOperatorDashboardPage />} />

              <Route path="/help" element={<HelpPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/about" element={<InfoPage title="About Travelar" />} />
              <Route path="/contact" element={<InfoPage title="Contact Us" />} />
              <Route path="/cancellation-policy" element={<InfoPage title="Cancellation and Refund Policy" />} />
              <Route path="/terms" element={<InfoPage title="Terms and Conditions" />} />
              <Route path="/privacy" element={<InfoPage title="Privacy Policy" />} />
              <Route path="/cookies" element={<InfoPage title="Cookie Policy" />} />
              <Route path="/api-enquiries" element={<InfoPage title="API and Integration Enquiries" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      </I18nProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
