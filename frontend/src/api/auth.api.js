import axiosClient from './axiosClient';

function extractUser(response) {
    return (
        response?.data?.data?.user ||
        null
    );
}

export async function registerUser(
    registrationData
) {
    const response =
        await axiosClient.post(
            '/auth/register',
            registrationData
        );

    return response?.data?.data?.user || null;
}

export async function loginUser(
    credentials
) {
    const response =
        await axiosClient.post(
            '/auth/login',
            credentials
        );

    return extractUser(response);
}

export async function logoutUser() {
    await axiosClient.post(
        '/auth/logout'
    );
}

export async function getCurrentUser() {
    const response =
        await axiosClient.get(
            '/auth/me'
        );

    return extractUser(response);
}