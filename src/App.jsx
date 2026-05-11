import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import NamingChecker from './components/NamingChecker';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doesmynamingsuck" element={<NamingChecker />} />
        </Routes>
    );
}

export default App;
