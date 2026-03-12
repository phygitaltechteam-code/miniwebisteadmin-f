import {useAuthContext} from '@/context/AuthContext';
import Footer from '@/features/Footer/Footer';
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import {useEffect, useState} from 'react';

const AppLayout = () => {
  const {isAuthenticated} = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const showFooterRoutes = [
    '/dashboard',
    '/projects',
    '/profile',
    '/payment/send/$id',
    '/wallet/toupscreen',
    '/topupwithdrawl/walletwithdrawl',
    '/beneficiary/statuspending',
    '/updatebeneficiary/$id',
    '/wallet/transaction/$id',
    '/accounthub/enter-currentpin',
    '/accounthub/setnew-pin',
    '/accounthub/confirm-pin',
    '/currencyconverter',
    '/wallet/paymentdashbord',
    '/accounthub/personal-info',
    '/accounthub/contact-info',
    '/accounthub/chnagepassword',
    '/eprivate/statement',
    '/beneficiary/addbeneficiaryy',
    // '/updatebeneficiary/$id',
    '/beneficiary/statusrejected',
  ];

  const showFooter =
    showFooterRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/payment/send/') ||
    location.pathname.startsWith('/wallet/transaction/') ||
    location.pathname.startsWith('/wallet/transferlist/') ||
    location.pathname.startsWith('/updatebeneficiary/');

  console.log(showFooter);
  useEffect(() => {
    !isAuthenticated && navigate({to: '/signin'});
  }, [isAuthenticated]);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <Outlet />
            <div className="">{!showFooter && <Footer />}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
