import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './components/Home';
import NamingChecker from './components/NamingChecker';

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const search = window.location.search;
        if (search.startsWith('/?')) {
            const path = search.slice(2).split('&')[0].replace(/~and~/g, '&');
            navigate(path);
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
