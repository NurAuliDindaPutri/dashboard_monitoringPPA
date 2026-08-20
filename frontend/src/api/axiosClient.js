import axios from 'axios';

function getApiBaseUrl() {
    if (import.meta.env.DEV) {
        return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }

    return (
        import.meta.env
            .VITE_API_BASE_URL ||
        '/api'
    );
}

const apiClient = axios.create({
    baseURL: getApiBaseUrl(),

    withCredentials: true,

    headers: {
        'Content-Type':
            'application/json',

        'X-PPA-Client':
            'web',
    },
});

apiClient.interceptors.response.use(
    (response) => response,

    (requestError) => {
        const requestUrl =
            requestError.config?.url ||
            '';

        const isLoginRequest =
            requestUrl.includes(
                '/auth/login'
            );

        const isRegisterRequest =
            requestUrl.includes(
                '/auth/register'
            );

        const isSessionCheck =
            requestUrl.includes(
                '/auth/me'
            );

        if (
            requestError.response
                ?.status === 401 &&
            !isLoginRequest &&
            !isRegisterRequest &&
            !isSessionCheck
        ) {
            window.dispatchEvent(
                new Event(
                    'ppa:unauthorized'
                )
            );
        }

        return Promise.reject(
            requestError
        );
    }
);

export default apiClient;