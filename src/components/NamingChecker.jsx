import { useState, useEffect } from 'react';

const NamingChecker = () => {
    const [type, setType] = useState('branch');
    const [inputValue, setInputValue] = useState('');
    const [checks, setChecks] = useState([]);

    const branchPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'release/', 'develop', 'main'];

    const validateBranch = (name) => {
        const checks = [];
        // Check starts with valid prefix
        const hasValidPrefix = branchPrefixes.some(prefix => name.startsWith(prefix));
        checks.push({ condition: 'Starts with valid branch prefix (feature/, bugfix/, etc.)', passed: hasValidPrefix });

        // Check all lowercase except story name
        const afterPrefix = name.split('/')[1] || '';
        const storyMatch = afterPrefix.match(/^([A-Z]+-\d+)-/);
        let storyPart = '';
        if (storyMatch) {
            storyPart = storyMatch[1];
        }
        const descriptionPart = afterPrefix.replace(new RegExp(`^${storyPart}-`), '');
        const isLowercase = descriptionPart === descriptionPart.toLowerCase();
        checks.push({ condition: 'Description part is all lowercase', passed: isLowercase });

        // Check separated by hyphens
        const hasHyphens = descriptionPart.includes('-') && !descriptionPart.includes('_') && !descriptionPart.includes(' ');
        checks.push({ condition: 'Description separated by hyphens (no spaces or underscores)', passed: hasHyphens });

        // Check includes story name
        const hasStory = storyMatch !== null;
        checks.push({ condition: 'Includes story name at start (e.g., ABC-123)', passed: hasStory });

        return checks;
    };

    const validateCommit = (name) => {
        const checks = [];
        // Starts with story name
        const storyMatch = name.match(/^([A-Z]+-\d+)\s/);
        checks.push({ condition: 'Starts with story name (e.g., ABC-123) followed by a <space>', passed: storyMatch !== null });

        // No special characters, only alphanumeric, spaces, hyphens
        const hasOnlyAllowedChars = /^[a-zA-Z0-9\s\-]+$/.test(name);
        checks.push({ condition: 'No special characters (only letters, numbers, spaces, hyphens)', passed: hasOnlyAllowedChars });

        return checks;
    };

    const validateFunction = (name) => {
        // TBD
        return [{ condition: 'Function name validation TBD', passed: false }];
    };

    useEffect(() => {
        let newChecks = [];
        if (type === 'branch') {
            newChecks = validateBranch(inputValue);
        } else if (type === 'commit') {
            newChecks = validateCommit(inputValue);
        } else if (type === 'function') {
            newChecks = validateFunction(inputValue);
        }
        setChecks(newChecks);
    }, [inputValue, type]);

    return (
        <div className="naming-checker">
            <h2>Naming Convention Checker</h2>
            <div className="type-selector">
                <label>
                    Type:
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="branch">Branch Name</option>
                        <option value="commit">Commit Message</option>
                        <option value="function">Function Name</option>
                    </select>
                </label>
            </div>
            <div className="input-section">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Enter ${type} name`}
                />
            </div>
            <div className="checks">
                {checks.map((check, index) => (
                    <div key={index} className="check-item">
                        <span className={check.passed ? 'check' : 'x'}>{check.passed ? '✓' : '✗'}</span>
                        <span>{check.condition}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NamingChecker;