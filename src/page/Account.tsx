import Select from 'react-select';
import {useGetGameQuery, useLazyGetAccountsQuery, useGetIncomeQuery, useGetSalesStatsQuery} from '../services/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image } from '../components/Image';
import NoAccountsNotification from '../components/NoAccountsNotification';

const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        // Check if dark mode is enabled in localStorage
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode !== null) {
            return darkMode === 'true';
        }
        // Default to dark mode if no preference is set
        return true;
    });
    
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDark(document.documentElement.classList.contains('dark'));
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);
    
    return isDark;
};

export default function AccountPage(){
    const isDark = useTheme();
    const navigate = useNavigate()
    const { gameId } = useParams()
    const [params, setParams] = useState<{[key: string]: string}>({})
    const [loadAccounts,{data: accounts, isLoading}] = useLazyGetAccountsQuery();
    const {data: game} = useGetGameQuery({gameId: parseInt(gameId!)});
    const {data: incomeData} = useGetIncomeQuery();
    const {data: salesStats} = useGetSalesStatsQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [imagePreview, setImagePreview] = useState<string|null>(null);
    const [filterOpen, setFilterOpen] = useState(true);

    useEffect(() => {
        loadAccounts({gameId: parseInt(gameId!), query: params})
    }, [params])

    useEffect(()=>{
        document.title = `ExZork Shop | ${game?.name} Accounts`
    },[game])

    const getStatusColor = (status?: string) => {
        switch(status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-500';
            case 'delivered':
                return 'bg-green-500';
            case 'failed':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const gameStats = salesStats?.find(stat => stat.game_id === parseInt(gameId!));

    const handleCopyChange = (type: 'character' | 'weapon', value: string, copies: number) => {
        console.log('Before update:', { type, value, copies, params });
        
        if (type === 'character') {
            const currentParams = params.characters || '';
            const entries = currentParams.split(',').filter(Boolean);
            
            // Count current copies
            const currentCopies = entries.filter(entry => entry === value).length;
            const newCopies = Math.max(0, Math.min(7, currentCopies + copies));
            
            console.log('Character update:', { currentParams, currentCopies, newCopies, entries });
            
            // Create new array with correct number of copies
            const newEntries = entries.filter(entry => entry !== value);
            for (let i = 0; i < newCopies; i++) {
                newEntries.push(value);
            }
            
            const newParams = {
                ...params,
                characters: newEntries.join(',')
            };
            console.log('New params:', newParams);
            setParams(newParams);
        } else {
            const currentParams = params.weapons || '';
            const entries = currentParams.split(',').filter(Boolean);
            
            // Count current copies
            const currentCopies = entries.filter(entry => entry === value).length;
            const newCopies = Math.max(0, Math.min(7, currentCopies + copies));
            
            console.log('Weapon update:', { currentParams, currentCopies, newCopies, entries });
            
            // Create new array with correct number of copies
            const newEntries = entries.filter(entry => entry !== value);
            for (let i = 0; i < newCopies; i++) {
                newEntries.push(value);
            }
            
            const newParams = {
                ...params,
                weapons: newEntries.join(',')
            };
            console.log('New params:', newParams);
            setParams(newParams);
        }
    };

    const handleCharacterClick = (character: string) => {
        const currentParams = params.characters || '';
        const entries = currentParams.split(',').filter(Boolean);
        
        // Count current copies
        const currentCopies = entries.filter(entry => entry === character).length;
        const newCopies = Math.min(7, currentCopies + 1);
        
        // Create new array with correct number of copies
        const newEntries = entries.filter(entry => entry !== character);
        for (let i = 0; i < newCopies; i++) {
            newEntries.push(character);
        }
        
        setParams({
            ...params,
            characters: newEntries.join(',')
        });
    };

    const handleWeaponClick = (weapon: string) => {
        const currentParams = params.weapons || '';
        const entries = currentParams.split(',').filter(Boolean);
        
        // Count current copies
        const currentCopies = entries.filter(entry => entry === weapon).length;
        const newCopies = Math.min(7, currentCopies + 1);
        
        // Create new array with correct number of copies
        const newEntries = entries.filter(entry => entry !== weapon);
        for (let i = 0; i < newCopies; i++) {
            newEntries.push(weapon);
        }
        
        setParams({
            ...params,
            weapons: newEntries.join(',')
        });
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
            <div className='bg-gray-900 dark:bg-gray-800 min-h-[10vh] flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4'>
                <div className="text-xl md:text-3xl font-semibold text-white mb-4 md:mb-0">
                    ExZork Shop | {game?.name} Account
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    {isAuthenticated && (
                        <Link 
                            to={`/games/${gameId}/add`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200 mb-4 md:mb-0"
                        >
                            Add Account
                        </Link>
                    )}
                    {isAuthenticated ? (
                        incomeData?.data && (
                            <div className="text-white text-center md:text-right">
                                <div className="text-sm text-gray-300">Total Income</div>
                                <div className="text-xl font-semibold">
                                    {formatCurrency(incomeData.data.find(income => income.game_id === parseInt(gameId!))?.total_income ?? 0)}
                                </div>
                                <div className="text-sm text-gray-300">
                                    {(incomeData.data.find(income => income.game_id === parseInt(gameId!))?.total_sold ?? 0).toLocaleString()} accounts sold
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-white text-center md:text-right">
                            <div className="text-sm text-gray-300">Total Transaction</div>
                            <div className="text-xl font-semibold">
                                {formatCurrency(gameStats?.total_revenue ?? 0)}
                            </div>
                            <div className="text-sm text-gray-300">
                                {(gameStats?.total_sold ?? 0).toLocaleString()} accounts sold
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mx-4 md:mx-12 flex flex-1 flex-col lg:flex-row relative">
                <div className={`bg-white dark:bg-gray-800 transition-all duration-300 ${filterOpen ? 'w-full lg:min-w-96 lg:max-w-96 my-4 lg:my-8' : 'w-0 min-w-0 max-w-0 h-0 overflow-hidden px-0 py-0 my-0 opacity-0'}`}>
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className={`text-lg font-semibold text-gray-900 dark:text-gray-100 transition-opacity duration-200 ${filterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Filters</div>
                        {filterOpen && (
                            <button onClick={() => setFilterOpen(false)} className="ml-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-1 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" /></svg>
                            </button>
                        )}
                    </div>
                    {filterOpen && (
                        <>
                        <div className="px-4 py-2">
                            <Select 
                                isSearchable
                                isMulti
                                placeholder="Server"
                                name='server'
                                className="w-full text-gray-900 dark:text-gray-100"
                                classNamePrefix="select"
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setParams({...params, servers: selectedOption.map((option) => option.value).join(',')})
                                    }
                                }}
                                options={game?.servers.map((server) => ({label: server.name, value: server.value}))}
                                styles={{
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'inherit'
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: 'inherit'
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: 'inherit'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                        color: 'inherit'
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused 
                                            ? (isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)')
                                            : 'transparent',
                                        color: 'inherit',
                                        ':active': {
                                            backgroundColor: isDark ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'
                                        }
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)',
                                        color: 'inherit'
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: 'inherit'
                                    })
                                }}
                                theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary: '#4B5563',
                                        primary75: '#6B7280',
                                        primary50: '#9CA3AF',
                                        primary25: '#D1D5DB',
                                        neutral0: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                        neutral5: isDark ? '#374151' : '#F3F4F6',
                                        neutral10: isDark ? '#4B5563' : '#E5E7EB',
                                        neutral20: isDark ? '#6B7280' : '#D1D5DB',
                                        neutral30: '#9CA3AF',
                                        neutral40: isDark ? '#D1D5DB' : '#6B7280',
                                        neutral50: isDark ? '#E5E7EB' : '#4B5563',
                                        neutral60: isDark ? '#F3F4F6' : '#374151',
                                        neutral70: isDark ? '#F9FAFB' : '#1F2937',
                                        neutral80: isDark ? '#FFFFFF' : '#111827',
                                        neutral90: isDark ? '#FFFFFF' : '#000000',
                                    },
                                })}
                            />
                        </div>
                        <div className='px-4 py-2'>
                            <Select 
                                isSearchable
                                placeholder="Gender"
                                name='Gender'
                                className="w-full text-gray-900 dark:text-gray-100"
                                classNamePrefix="select"
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setParams({...params, gender: selectedOption.value})
                                    }
                                }}
                                options={[{label: 'Female', value: 'F'}, {label: 'Male', value: 'M'}]}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                        borderColor: isDark ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)',
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                        border: isDark ? '1px solid rgb(75, 85, 99)' : '1px solid rgb(209, 213, 219)',
                                        zIndex: 9999
                                    }),
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused 
                                            ? (isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)')
                                            : 'transparent',
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
                                        ':active': {
                                            backgroundColor: isDark ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'
                                        }
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)',
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                                    })
                                }}
                                menuPortalTarget={document.body}
                                theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary: '#4B5563',
                                        primary75: '#6B7280',
                                        primary50: '#9CA3AF',
                                        primary25: '#D1D5DB',
                                        neutral0: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                        neutral5: isDark ? '#374151' : '#F3F4F6',
                                        neutral10: isDark ? '#4B5563' : '#E5E7EB',
                                        neutral20: isDark ? '#6B7280' : '#D1D5DB',
                                        neutral30: '#9CA3AF',
                                        neutral40: isDark ? '#D1D5DB' : '#6B7280',
                                        neutral50: isDark ? '#E5E7EB' : '#4B5563',
                                        neutral60: isDark ? '#F3F4F6' : '#374151',
                                        neutral70: isDark ? '#F9FAFB' : '#1F2937',
                                        neutral80: isDark ? '#FFFFFF' : '#111827',
                                        neutral90: isDark ? '#FFFFFF' : '#000000',
                                    },
                                })}
                            />
                        </div>
                        <div className="px-4 pb-2">
                            <div>
                                <label className='font-semibold text-gray-900 dark:text-gray-100'>Characters</label>
                                <div className='grid grid-cols-4 gap-1 sm:gap-2 mb-2'>
                                    {game?.characters.map((character) => {
                                        const currentParams = params.characters || '';
                                        const entries = currentParams.split(',').filter(Boolean);
                                        const copies = entries.filter(entry => entry === character.value).length;
                                        const selected = copies > 0;
                                        
                                        return (
                                            <div
                                                key={character.value}
                                                className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative flex items-center justify-center aspect-square rounded'}
                                                data-tooltip-id="tooltip-characters"
                                                data-tooltip-content={character.name}
                                                data-tooltip-place="top"
                                            >
                                                <Image src={character.image} alt="" className="w-full h-full p-1 object-contain" onClick={() => handleCharacterClick(character.value)} />
                                                {selected && (
                                                    <>
                                                        <button
                                                            className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-sm focus:outline-none flex items-center justify-center transition-colors shadow-lg"
                                                            style={{
                                                                width: '1.5rem',
                                                                height: '1.5rem',
                                                                fontSize: 'clamp(0.6rem, 3vw, 0.9rem)'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyChange('character', character.value, -1);
                                                            }}
                                                        >-</button>
                                                        <button
                                                            className="absolute top-1 right-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-sm focus:outline-none flex items-center justify-center transition-colors shadow-lg"
                                                            style={{
                                                                width: '1.5rem',
                                                                height: '1.5rem',
                                                                fontSize: 'clamp(0.6rem, 3vw, 0.9rem)'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyChange('character', character.value, 1);
                                                            }}
                                                        >+</button>
                                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 rounded-md px-1 py-0.5 shadow-lg">
                                                            <span className="font-bold text-white dark:text-gray-900 select-none text-center" style={{
                                                                fontSize: 'clamp(0.5rem, 2.5vw, 0.75rem)'
                                                            }}>
                                                                C{copies - 1}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <Tooltip id="tooltip-characters" place="top" />
                                </div>
                                <label className='font-semibold text-gray-900 dark:text-gray-100'>Weapons</label>
                                <div className='grid grid-cols-4 gap-1 sm:gap-2'>
                                    {game?.weapons.map((weapon) => {
                                        const currentParams = params.weapons || '';
                                        const entries = currentParams.split(',').filter(Boolean);
                                        const copies = entries.filter(entry => entry === weapon.value).length;
                                        const selected = copies > 0;
                                        
                                        return (
                                            <div
                                                key={weapon.value}
                                                className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative flex items-center justify-center aspect-square rounded'}
                                                data-tooltip-id="tooltip-weapons"
                                                data-tooltip-content={weapon.name}
                                                data-tooltip-place="top"
                                            >
                                                <Image src={weapon.image} alt="" className="w-full h-full p-1 object-contain" onClick={() => handleWeaponClick(weapon.value)} />
                                                {selected && (
                                                    <>
                                                        <button
                                                            className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-sm focus:outline-none flex items-center justify-center transition-colors shadow-lg"
                                                            style={{
                                                                width: '1.5rem',
                                                                height: '1.5rem',
                                                                fontSize: 'clamp(0.6rem, 3vw, 0.9rem)'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyChange('weapon', weapon.value, -1);
                                                            }}
                                                        >-</button>
                                                        <button
                                                            className="absolute top-1 right-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-sm focus:outline-none flex items-center justify-center transition-colors shadow-lg"
                                                            style={{
                                                                width: '1.5rem',
                                                                height: '1.5rem',
                                                                fontSize: 'clamp(0.6rem, 3vw, 0.9rem)'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyChange('weapon', weapon.value, 1);
                                                            }}
                                                        >+</button>
                                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 rounded-md px-1 py-0.5 shadow-lg">
                                                            <span className="font-bold text-white dark:text-gray-900 select-none text-center" style={{
                                                                fontSize: 'clamp(0.5rem, 2.5vw, 0.75rem)'
                                                            }}>
                                                                C{copies - 1}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <Tooltip id="tooltip-weapons" place="top" />
                                </div>
                            </div>
                        </div>
                        </>
                    )}
                </div>
                <div className='lg:ml-12 ml-0 my-4 lg:my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh] w-full flex-col'>
                    {!filterOpen && (
                        <div className="flex justify-start mb-4">
                            <button onClick={() => setFilterOpen(true)} className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-2 rounded-md font-semibold shadow hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200">
                                Search
                            </button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex justify-center items-center w-full">
                            <div className="text-gray-500 dark:text-gray-400 text-lg">Loading accounts...</div>
                        </div>
                    ) : !accounts || accounts.length === 0 ? (
                        game ? (
                            <NoAccountsNotification 
                                game={game}
                                searchParams={params}
                                hasSearchCriteria={params && Object.keys(params).length > 0}
                            />
                        ) : (
                        <div className="flex flex-col items-center justify-center w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading...</h3>
                        </div>
                        )
                    ) : (
                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-6 min-h-[400px] flex items-start">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 w-full">
                                {accounts?.map((item, index) => (
                                    <div key={index} className="transform transition-all duration-200 hover:scale-[1.02]">
                                        <div className='bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col h-full'>
                                            <div className="relative mb-3">
                                                <div className="w-full aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden cursor-pointer" onClick={() => setImagePreview(item.images)}>
                                                    <Image src={item.images} alt="" className="w-full h-full object-cover"/>
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium">
                                                    {game?.servers.find(server => server.value === item.server_name)?.name}
                                                </div>
                                                {item.banner_guarantee && (
                                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                                                        Rate On
                                                    </div>
                                                )}
                                            </div>
                                            <div className='space-y-3 flex-1 flex flex-col'>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{item.code}</div>
                                                {isAuthenticated ? (
                                                    item.transaction_status && (
                                                        <div className={`px-2 py-1 rounded text-white text-xs font-medium mb-2 ${getStatusColor(item.transaction_status)}`}>
                                                            {item.transaction_status}
                                                        </div>
                                                    )
                                                ) : (
                                                    <button 
                                                        className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium mb-2 w-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]" 
                                                        onClick={() => {
                                                            navigate(`/games/${gameId}/accounts/${item.id}`)
                                                        }}
                                                    >
                                                        Buy {formatCurrency(item.price)}
                                                    </button>
                                                )}
                                                {item.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-auto">
                                                    {item.characters.map((character, index) => (
                                                        <span className='bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium' key={index}>
                                                            {character.character}{character.copies > 0 && ` (${character.copies})`}
                                                        </span>
                                                    ))}
                                                    {item.weapons.map((weapon, index) => (
                                                        <span className='bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium' key={index}>
                                                            {weapon.weapon}{weapon.copies > 0 && ` (${weapon.copies})`}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {imagePreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setImagePreview(null)}>
                    <div className="relative max-w-4xl w-full flex justify-center" onClick={e => e.stopPropagation()}>
                        <Image src={imagePreview} alt="Preview" className="max-h-[90vh] rounded-lg shadow-2xl object-contain" />
                        <button className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition-colors" onClick={() => setImagePreview(null)}>
                            <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}