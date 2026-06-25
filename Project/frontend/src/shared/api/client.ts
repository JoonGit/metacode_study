import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// 10-second timeout default
const TIMEOUT_MS = 10000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: "/api", // Will proxy to backend or hit mock endpoint
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

export const backendApi = apiClient;

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject AbortController for manual cancellation if needed, though axios timeout handles standard timeouts
    const controller = new AbortController();
    config.signal = controller.signal;

    console.log(
      `🔵 [API Request] ${config.method?.toUpperCase()} ${config.url}`,
      '\nPayload:', config.data || '(no data)'
    );

    // Add token if exists, etc.
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `🟢 [API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`,
      '\nData:', response.data
    );
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = "알 수 없는 오류가 발생했습니다.";

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      errorMessage =
        "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.";
    } else if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) {
        errorMessage = "잘못된 요청입니다. (품절 등 데이터 정합성 오류)";
      } else if (status >= 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
    }

    // In a real app, you'd trigger a global Toast from here, e.g. using Zustand
    // useToastStore.getState().showToast(errorMessage);
    console.error("[Global API Error]", errorMessage, error);

    return Promise.reject(error);
  },
);
