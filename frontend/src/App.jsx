import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes';
import SplashScreen from './components/common/SplashScreen';

function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 1600);

        const removeTimer = setTimeout(() => {
            setShowSplash(false);
        }, 1950);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    return (
        <BrowserRouter>
            {showSplash && (
                <SplashScreen exiting={isExiting} />
            )}

            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;