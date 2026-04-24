import { useState, useEffect } from "react";
import { uploadImage, useAddAccountMutation, useGetGameQuery, useGetRollerQuery, useLazyGetAccountsQuery, useGetIncomeQuery, useDeleteAccountMutation, useLazyGetAccountQuery, useGetWhitelistedEmailsQuery } from "../services/api";
import { Account } from "../services/types";
import { useParams, Navigate } from "react-router-dom";
import Select from 'react-select';
import { FileUploader } from "react-drag-drop-files";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image } from '../components/Image';
import { ImageSlider } from '../components/ImageSlider';
import { CiEdit, CiTrash } from "react-icons/ci";

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

export default function AddAccountPage(){
    const isDark = useTheme();
    const params = useParams();
    const gameId = params.gameId ? parseInt(params.gameId) : null;
    
    if (!gameId) {
        return <Navigate to="/" />;
    }

    const {data: game, isLoading: isGameLoading} = useGetGameQuery({gameId});
    const {data: incomeData} = useGetIncomeQuery();
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const {data: roller, isLoading: isRollerLoading} = useGetRollerQuery();
    const [loading, setLoading] = useState<boolean>(false)
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [account, setAccount] = useState<Account>({
        game_id: gameId,
        server_name: "",
        level: 1,
        banner_guarantee: false,
        code: "",
        description: "",
        price: 0,
        roller: "",
        images: [],
        login: "Email",
        characters: [],
        weapons: [],
        email: "",
        password: "",
        gender: "F",
        recovery_email: ""
    });
    const [addAccount,{}] = useAddAccountMutation();
    const [imagePreview, setImagePreview] = useState<string|null>(null);
    const [filterOpen, setFilterOpen] = useState(true);
    const [loadAccount,{}] = useLazyGetAccountQuery();
    const [deleteAccount,{}] = useDeleteAccountMutation();
    const [imgurLink, setImgurLink] = useState("");
    const [selectedDomain, setSelectedDomain] = useState<string>("");
    const { data: whitelistedEmails } = useGetWhitelistedEmailsQuery();

    useEffect(() => {
        console.log(account)
    }, [account])

    useEffect(()=>{
        if (isAuthenticated && roller?.code) {
            loadAccounts({gameId: gameId, query: {prefix: roller.code}})
        }
    },[roller, isAuthenticated])

    useEffect(() => {
        if (roller?.code) {
            const defaultDomain = whitelistedEmails?.[0]?.domain || 'exzork.me';
            setSelectedDomain(defaultDomain);
            setAccount(prev => ({
                ...prev,
                roller: roller.code,
                email: `@${defaultDomain}`
            }));
        }
    }, [roller?.code, whitelistedEmails]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Check if the pasted/typed value contains a whitelisted domain
        const whitelistedDomains = whitelistedEmails?.map(w => w.domain) || [];
        const foundDomain = whitelistedDomains.find(d => {
            const idx = value.lastIndexOf(`@${d}`);
            return idx !== -1;
        });

        if (foundDomain) {
            const username = value.replace(`@${foundDomain}`, '');
            setSelectedDomain(foundDomain);
            setAccount(prev => ({
                ...prev,
                email: `${username}@${foundDomain}`
            }));
        } else {
            const username = value.replace(/@[\w.-]+/, '');
            setAccount(prev => ({
                ...prev,
                email: `${username}@${selectedDomain}`
            }));
        }
    };

    const handleDomainChange = (domain: string) => {
        setSelectedDomain(domain);
        setAccount(prev => {
            const username = prev.email.replace(/@[\w.-]+/, '');
            return {
                ...prev,
                email: `${username}@${domain}`
            };
        });
    };

    const handleCharacterClick = (character: string) => {
        const found = account.characters.find((c) => c.character === character);
        if (found) {
            const currentCopies = found.copies || 0;
            const newCopies = Math.min(6, currentCopies + 1);
            
            setAccount({
                ...account,
                characters: account.characters.map((c) =>
                    c.character === character ? { ...c, copies: newCopies } : c
                ),
            });
        } else {
            setAccount({
                ...account,
                characters: [...account.characters, { character, copies: 0, level: 1 }],
            });
        }
    };

    const handleCharacterRemove = (character: string) => {
        const found = account.characters.find((c) => c.character === character);
        if (found) {
            const currentCopies = found.copies ?? 0;  // Use actual value, default to 0
            const newCopies = currentCopies - 1;
            
            if (newCopies < 0) {
                // Remove the character completely when copies go below 0
                setAccount({
                    ...account,
                    characters: account.characters.filter((c) => c.character !== character),
                });
            } else {
                setAccount({
                    ...account,
                    characters: account.characters.map((c) =>
                        c.character === character ? { ...c, copies: newCopies } : c
                    ),
                });
            }
        }
    };

    const handleWeaponClick = (weapon: string) => {
        const found = account.weapons.find((w) => w.weapon === weapon);
        if (found) {
            const currentCopies = found.copies || 0;
            const newCopies = Math.min(6, currentCopies + 1);
            
            setAccount({
                ...account,
                weapons: account.weapons.map((w) =>
                    w.weapon === weapon ? { ...w, copies: newCopies } : w
                ),
            });
        } else {
            setAccount({
                ...account,
                weapons: [...account.weapons, { weapon, copies: 0, level: 1 }],
            });
        }
    };

    const handleWeaponRemove = (weapon: string) => {
        const found = account.weapons.find((w) => w.weapon === weapon);
        if (found) {
            const currentCopies = found.copies ?? 0;  // Use actual value, default to 0
            const newCopies = currentCopies - 1;
            
            if (newCopies < 0) {
                // Remove the weapon completely when copies go below 0
                setAccount({
                    ...account,
                    weapons: account.weapons.filter((w) => w.weapon !== weapon),
                });
            } else {
                setAccount({
                    ...account,
                    weapons: account.weapons.map((w) =>
                        w.weapon === weapon ? { ...w, copies: newCopies } : w
                    ),
                });
            }
        }
    };

    

    const handleEdit = async (accountId: number) => {
        const result = await loadAccount({gameId, accountId}).unwrap();
        setAccount(result);
        setFilterOpen(true);
    };

    const handleDelete = async (accountId: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            await deleteAccount({
                account: {
                    game_id: gameId,
                    id: accountId,
                    server_name: "",
                    level: 1,
                    banner_guarantee: false,
                    roller: roller?.code || "",
                    
                    code: "",
                    description: "",
                    price: 0,
                    images: [],
                    login: "",
                    characters: [],
                    weapons: [],
                    email: "",
                    password: "",
                    gender: "F",
                    recovery_email: ""
                }
            }).unwrap();
            loadAccounts({gameId: gameId, query: {prefix: roller?.code}});
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">Please log in to access this page</div>
            </div>
        );
    }

    if (isGameLoading || isRollerLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600">Game not found</div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
                <div className='bg-gray-900 dark:bg-gray-800 min-h-[10vh] flex flex-col md:flex-row justify-between items-center px-4 md:px-12 py-4'>
                    <div className="text-xl md:text-3xl font-semibold text-white mb-4 md:mb-0">
                        ExZork Shop | {game?.name} Account
                    </div>
                    {incomeData?.data && (
                        <div className="text-white text-center md:text-right">
                            <div className="text-sm text-gray-300">Total Income</div>
                            <div className="text-xl font-semibold">
                                ${incomeData.data.find(income => income.game_id === gameId)?.total_income.toFixed(2) ?? '0.00'}
                            </div>
                            <div className="text-sm text-gray-300">
                                {incomeData.data.find(income => income.game_id === gameId)?.total_sold ?? 0} accounts sold
                            </div>
                        </div>
                    )}
                </div>
                <div className="mx-4 md:mx-12 flex flex-1 flex-col lg:flex-row">
                    <div className={`bg-white dark:bg-gray-800 transition-all duration-300 ${filterOpen ? 'w-full lg:min-w-96 lg:max-w-96 my-4 lg:my-8' : 'w-0 min-w-0 max-w-0 h-0 overflow-hidden px-0 py-0 my-0 opacity-0'}`}> 
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <div className={`text-lg font-semibold text-gray-900 dark:text-gray-100 transition-opacity duration-200 ${filterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{account.id ? "Edit" : "Add"} Account | {roller?.name}</div>
                            <button onClick={() => setFilterOpen(!filterOpen)} className="ml-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-1 transition-colors">
                                {filterOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
                                )}
                            </button>
                        </div>
                        {filterOpen && (
                        <>
                        <div className="px-4 py-2">
                            <Select 
                                options={game?.servers.map((server) => ({label: server.name, value: server.value}))}
                                isSearchable
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setAccount({...account!, server_name: selectedOption.value})
                                    }
                                }}
                                className="text-gray-900 dark:text-gray-100"
                                classNamePrefix="select"
                                placeholder="Select server..."
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
                        <div className="px-4 py-2">
                            <input type="checkbox" className="mr-2" onChange={(e) => setAccount({...account!, banner_guarantee: e.target.checked})} id="banner_guarantee" checked={account.banner_guarantee}/>
                            <label htmlFor="banner_guarantee" className="text-gray-900 dark:text-gray-100">Banner Guarantee</label>
                        </div>
                        <div className="px-4 py-2">
                            <textarea placeholder="Description" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setAccount({...account!, description: e.target.value})} value={account.description}/>
                        </div>
                        <div className="px-4 py-2">
                            <Select 
                                isSearchable
                                placeholder="Gender"
                                name='Gender'
                                className="w-full text-gray-900 dark:text-gray-100"
                                classNamePrefix="select"
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setAccount({...account!, gender: selectedOption.value})
                                    }
                                }}
                                value={{label: account.gender === "F" ? "Female" : "Male", value: account.gender}}
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
                        <div className="px-4 py-2">
                            <label className='font-semibold text-gray-900 dark:text-gray-100'>Characters</label>
                            <div className='grid grid-cols-4 gap-1 sm:gap-2 mb-2'>
                                {game?.characters.map((character) => {
                                    const found = account.characters.find((c) => c.character === character.value);
                                    const selected = !!found;
                                    const copies = found?.copies || 0;
                                    
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
                                                            handleCharacterRemove(character.value);
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
                                                            handleCharacterClick(character.value);
                                                        }}
                                                    >+</button>
                                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 rounded-md px-1 py-0.5 shadow-lg">
                                                        <span className="font-bold text-white dark:text-gray-900 select-none text-center" style={{
                                                            fontSize: 'clamp(0.5rem, 2.5vw, 0.75rem)'
                                                        }}>
                                                            C{copies}
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
                                    const found = account.weapons.find((w) => w.weapon === weapon.value);
                                    const selected = !!found;
                                    const copies = found?.copies || 0;
                                    
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
                                                            handleWeaponRemove(weapon.value);
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
                                                            handleWeaponClick(weapon.value);
                                                        }}
                                                    >+</button>
                                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/90 rounded-md px-1 py-0.5 shadow-lg">
                                                        <span className="font-bold text-white dark:text-gray-900 select-none text-center" style={{
                                                            fontSize: 'clamp(0.5rem, 2.5vw, 0.75rem)'
                                                        }}>
                                                            C{copies}
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
                        <div className="px-4 py-2">
                            <Select 
                                isSearchable
                                placeholder="Login Method"
                                name='LoginMethod'
                                className="w-full text-gray-900 dark:text-gray-100"
                                classNamePrefix="select"
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setAccount({...account!, login: selectedOption.value})
                                    }
                                }}
                                value={{label: account.login, value: account.login}}
                                options={[
                                    {label: 'Email', value: 'Email'}, 
                                    {label: 'Username', value: 'Username'}, 
                                    {label: 'Google', value: 'Google'}
                                ]}
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
                                            : (isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)'),
                                        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
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
                        {account.login === 'Email' && (
                        <div className="px-4 py-2">
                            <div className="relative">
                                <div className="flex">
                                    <input 
                                        type="text" 
                                        placeholder="email" 
                                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-l-md focus:ring-gray-500 focus:border-gray-500" 
                                        value={(() => {
                                            if (!account.email) return '';
                                            return account.email.replace(/@[\w.-]+/, '');
                                        })()}
                                        onChange={handleEmailChange}
                                    />
                                    <select
                                        className="border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-md px-2 text-sm focus:ring-gray-500 focus:border-gray-500"
                                        value={selectedDomain}
                                        onChange={(e) => handleDomainChange(e.target.value)}
                                    >
                                        {whitelistedEmails?.map((wl) => (
                                            <option key={wl.id} value={wl.domain}>
                                                @{wl.domain} {wl.is_managed ? '(Managed)' : ''}
                                            </option>
                                        ))}
                                        {!whitelistedEmails?.length && (
                                            <option value="exzork.me">@exzork.me</option>
                                        )}
                                    </select>
                                </div>
                                {whitelistedEmails?.find(w => w.domain === selectedDomain)?.is_managed && (
                                    <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">✓ Managed domain — email will be transferred to ZorkMail</p>
                                )}
                            </div>
                        </div>
                        )}
                        {account.login !== 'Email' && (
                        <div className="px-4 py-2">
                            <input 
                                type="text" 
                                placeholder={account.login === 'Username' ? 'Username' : account.login === 'Google' ? 'Google Account' : 'Login'}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                                onChange={(e) => setAccount({...account!, email: e.target.value})} 
                                value={account.email}
                            />
                        </div>
                        )}
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Password" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setAccount({...account!, password: e.target.value})} value={account.password}/>
                        </div>
                        <div className="px-4 py-2 flex items-center space-x-2">
                            <div className="text-gray-900 dark:text-gray-100">USD</div>
                            <input type="number" placeholder="Price" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setAccount({...account!, price: parseInt(e.target.value)})} value={account.price}/>
                        </div>
                        <div className="px-4 py-2">
                            <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1 block">Images</label>
                            <div className="flex flex-col space-y-2">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {account.images.map((img, index) => (
                                        <div key={index} className="relative group aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                                            <Image src={img} alt={`Account image ${index + 1}`} className="w-full h-full object-cover" />
                                            <button 
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setAccount({
                                                        ...account,
                                                        images: account.images.filter((_, i) => i !== index)
                                                    });
                                                }}
                                            >
                                                <CiTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <FileUploader multiple={true} handleChange={async (files: FileList | File) => {
                                    setLoading(true);
                                    try {
                                        const fileList = files instanceof FileList ? Array.from(files) : [files];
                                        const uploadPromises = fileList.map(file => uploadImage(file));
                                        const urls = await Promise.all(uploadPromises);
                                        setAccount({
                                            ...account,
                                            images: [...account.images, ...urls]
                                        });
                                    } catch (error) {
                                        Swal.fire({
                                            title: 'Error',
                                            text: 'Failed to upload one or more images.',
                                            icon: 'error'
                                        });
                                    } finally {
                                        setLoading(false);
                                    }
                                }} />
                                <div className="flex space-x-2 mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Add Imgur link..." 
                                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                        value={imgurLink}
                                        onChange={(e) => setImgurLink(e.target.value)}
                                    />
                                    <button 
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                        onClick={() => {
                                            if (imgurLink && imgurLink.includes('imgur.com')) {
                                                setAccount({
                                                    ...account,
                                                    images: [...account.images, imgurLink]
                                                });
                                                setImgurLink("");
                                            } else {
                                                Swal.fire({
                                                    title: 'Error',
                                                    text: 'Please enter a valid Imgur link.',
                                                    icon: 'error'
                                                });
                                            }
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <button className={`bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white w-full p-2 rounded transition-colors ${loading ? `hidden` : `block`}`} disabled={loading} onClick={async () => {
                                if (account.images.length === 0) {
                                    Swal.fire({
                                        title: 'Error',
                                        text: 'Please upload at least one image.',
                                        icon: 'error',
                                        confirmButtonText: 'Ok'
                                    })
                                    return
                                }
                                setLoading(true)
                                try {
                                    await addAccount({ account: account }).unwrap();
                                    setAccount({
                                        game_id: account.game_id,
                                        server_name: "",
                                        level: 1,
                                        banner_guarantee: false,
                                        code: "",
                                        description: "",
                                        price: 0,
                                        roller: roller?.code ?? "",
                                        images: [],
                                        login: "Email",
                                        characters: [],
                                        weapons: [],
                                        email: "",
                                        password: "",
                                        gender: "F",
                                        recovery_email: ""
                                    })
                                    loadAccounts({ gameId: gameId, query: { prefix: roller?.code } });
                                } catch (error) {
                                    Swal.fire({
                                        title: 'Error',
                                        text: 'Failed to add account.',
                                        icon: 'error'
                                    });
                                } finally {
                                    setLoading(false)
                                }
                            }}>{account.id ? "Edit" : "Add"} Account</button>
                        </div>
                        </>
                        )}
                    </div>
                    <div className='lg:ml-12 ml-0 my-4 lg:my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh] w-full flex-col'>
                        {!filterOpen && (
                            <div className="flex justify-start mb-4 w-full">
                                <button onClick={() => setFilterOpen(true)} className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-2 rounded-md font-semibold shadow hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200">
                                    Add Account
                                </button>
                            </div>
                        )}
                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-6 min-h-[400px] flex items-start">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 w-full">
                                {accounts?.map((item, index) => (
                                    <div key={index} className="transform transition-all duration-200 hover:scale-[1.02]">
                                        <div className='bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col h-full'>
                                            <div className="relative mb-3">
                                                <ImageSlider 
                                                    images={item.images} 
                                                    onClick={(url) => setImagePreview(url)}
                                                    className="w-full aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-600 rounded-md"
                                                />
                                                <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium z-10">
                                                    {game?.servers.find(server => server.value === item.server_name)?.name}
                                                </div>
                                                {item.banner_guarantee && (
                                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium z-10">
                                                        Rate On
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                                                    <button onClick={() => handleEdit(item.id!)} className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors">
                                                        <CiEdit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id!)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors">
                                                        <CiTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className='space-y-3 flex-1 flex flex-col'>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{item.code}</div>
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
        </>
    )
}