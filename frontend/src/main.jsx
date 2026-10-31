import React from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "./AuthContext";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";

import AboutUs from "./routes/aboutus";
import Cart from "./routes/cart";
import DisplayListingDetail from "./routes/listingdetail";
import HomePage from "./routes/home";
import HowItWorks from "./routes/howitworks";
import Listing from "./routes/createlisting";
import Login from "./routes/login";
import LogoutPage from "./components/LogOut";
import Profile from "./routes/profile";
import Register from "./routes/register";
import Root from "./routes/root";
import Search from "./components/SearchFeature";
import Footer from "./components/Footer/Footer";
import SearchFail from "./routes/searchfail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <div>ERROR</div>,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "aboutus/",
        element: <AboutUs />,
      },
      {
        path: "cart/",
        element: <Cart />,
      },
      {
        path: "createlisting/",
        element: <Listing />,
      },
      {
        path: "howitworks/",
        element: <HowItWorks />,
      },
      {
        path: "listingdetail/:id/",
        element: <DisplayListingDetail />,
      },
      {
        path: "login/",
        element: <Login />,
      },
      {
        path: "logout/",
        element: <LogoutPage />,
      },
      {
        path: "profile/",
        element: <Profile />,
      },
      {
        path: "register/",
        element: <Register />,
      },
      {
        path: "search/",
        element: <SearchFail />
      },
      {
        path: "search/:search",
        element: <Search />,
      },
    ],
  },
]);

// const App = () => {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route
//             path="/"
//             element={
//               <Root>
//                 <Route index element={<HomePage />} />
//                 <Route path="aboutus" element={<AboutUs />} />
//                 <Route path="cart" element={<Cart />} />
//                 <Route path="createlisting" element={<Listing />} />
//                 <Route path="editlisting/:id" element={<EditListing />} />
//                 <Route path="howitworks" element={<HowItWorks />} />
//                 <Route
//                   path="listingdetail/:id"
//                   element={<DisplayListingDetail />}
//                 />
//                 <Route path="login" element={<Login />} />
//                 <Route path="logout" element={<LogoutPage />} />
//                 <Route path="profile" element={<Profile />} />
//                 <Route path="register" element={<Register />} />
//               </Root>
//             }
//           />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// };

// Use createRoot and render
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
