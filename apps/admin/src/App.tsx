import { Refine, Authenticated } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import routerProvider, { NavigateToResource, CatchAllNavigate } from "@refinedev/react-router-v6";
import { ConfigProvider, App as AntdApp } from "antd";
import { useNotificationProvider, ThemedLayoutV2, AuthPage } from "@refinedev/antd";
import axios, { type AxiosInstance } from "axios";
import "@refinedev/antd/dist/reset.css";

import { UserList } from "./pages/users/list";
import { authProvider } from "./authProvider";

const axiosInstance = axios.create({
  withCredentials: true,
}) as AxiosInstance;

axiosInstance.interceptors.response.use(
  (response) => {
    // If the response has a "data" property (from our NestJS interceptor), return that instead
    if (response.data && response.data.data !== undefined) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AntdApp>
          <Refine
            dataProvider={dataProvider(
              import.meta.env.VITE_API_URL || "http://localhost:4001",
              axiosInstance as unknown as Parameters<typeof dataProvider>[1]
            )}
            routerProvider={routerProvider}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "users",
                list: "/users",
                meta: { canDelete: false },
              },
            ]}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-inner"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <ThemedLayoutV2>
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                <Route index element={<NavigateToResource resource="users" />} />
                <Route path="/users" element={<UserList />} />
              </Route>
              <Route
                element={
                  <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                    <NavigateToResource />
                  </Authenticated>
                }
              >
                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      providers={[
                        {
                          name: "google",
                          label: "Google",
                        },
                        {
                          name: "discord",
                          label: "Discord",
                        },
                      ]}
                    />
                  }
                />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
