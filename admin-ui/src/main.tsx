import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import { SuperTokensWrapper } from "supertokens-auth-react";

SuperTokens.init({
  appInfo: {
    appName: "Admin UI",
    apiDomain: 
      import.meta.env.VITE_SUPERTOKENS_API_DOMAIN || "http://localhost:8000",
    websiteDomain: 
      import.meta.env.VITE_SUPERTOKENS_WEBSITE_DOMAIN || "http://localhost:5173", 
    apiBasePath: "/auth",
    websiteBasePath: "/auth"
  },
  recipeList: [
    EmailPassword.init(),
    Session.init()
  ]
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SuperTokensWrapper>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
    </SuperTokensWrapper>
  </React.StrictMode>
);
