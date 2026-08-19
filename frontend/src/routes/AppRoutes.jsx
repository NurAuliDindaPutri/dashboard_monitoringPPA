import {
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';

import Register from '../pages/Register';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

import Login from '../pages/login';
import DashboardAllSite from '../pages/DashboardAllSite';
import DashboardPerSite from '../pages/DashboardPerSite';
import InputData from '../pages/InputData';
import DataUnit from '../pages/DataUnit';
import DetailLTSupply from '../pages/DetailLTSupply';
import PendingSupply from '../pages/PendingSupply';
import ImportMasterData from '../pages/ImportMasterData';

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                element={
                    <ProtectedRoute />
                }
            >
                <Route
                    element={<MainLayout />}
                >
                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard-all-site"
                                replace
                            />
                        }
                    />

                    <Route
                        path="/dashboard-all-site"
                        element={
                            <DashboardAllSite />
                        }
                    />
                    <Route
                        path="/dashboard-per-site"
                        element={
                            <DashboardPerSite />
                        }
                    />
                    <Route
                        path="/input-data"
                        element={<InputData />}
                    />
                    <Route
                        path="/data-unit"
                        element={<DataUnit />}
                    />
                    <Route
                        path="/detail-lt-supply"
                        element={
                            <DetailLTSupply />
                        }
                    />
                    <Route
                        path="/pending-supply"
                        element={
                            <PendingSupply />
                        }
                    />
                    <Route
                        path="/import-master-data"
                        element={
                            <ImportMasterData />
                        }
                    />
                </Route>
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/dashboard-all-site"
                        replace
                    />
                }
            />
        </Routes>
    );
}

export default AppRoutes;