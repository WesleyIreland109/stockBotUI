import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './components/Home';
import NamingChecker from './components/NamingChecker';

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const search = window.location.search;
        const encodedPathPrefix = '?/';
        if (search.startsWith(encodedPathPrefix)) {
            const path = search.slice(encodedPathPrefix.length).split('&')[0].replace(/~and~/g, '&');
            if (path) {
                navigate(path);
            }
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doesmynamingsuck" element={<NamingChecker />} />
        </Routes>
    );
}

export default App;
