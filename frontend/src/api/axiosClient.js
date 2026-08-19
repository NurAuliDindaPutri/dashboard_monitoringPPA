import axios from 'axios';

const axiosClient = axios.create({
    baseURL:
        import.meta.env
            .VITE_API_BASE_URL ||
        'http://localhost:5000/api',

    withCredentials: true,

    headers: {
        Accept: 'application/json',
        'X-PPA-Client': 'web',
    },
});

axiosClient.interceptors.response.use(
    (response) => response,
    (requestError) => {
        const isLoginRequest =
            requestError.config?.url?.includes(
                '/auth/login'
            );

        if (
            requestError.response?.status ===
            401 &&
            !isLoginRequest
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

export default axiosClient;