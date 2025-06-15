import { useState, useEffect } from "react";
import { uploadImage, useAddAccountMutation, useDeleteAccountMutation, useGetGameQuery, useGetRollerQuery, useLazyGetAccountQuery, useLazyGetAccountsQuery, useGetIncomeQuery } from "../services/api";
import { Account } from "../services/types";
import { useParams, Navigate } from "react-router-dom";
import Select from 'react-select';
import { FileUploader } from "react-drag-drop-files";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";
import { CiEdit, CiTrash } from "react-icons/ci";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image } from '../components/Image';

const getStatusColor = (status?: string) => {
    switch(status?.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-500';
        case 'delivered':
            return 'bg-green-500';
        case 'expired':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

export default function AddAccountPage(){
    const params = useParams();
    const gameId = params.gameId ? parseInt(params.gameId) : null;
    
    if (!gameId) {
        return <Navigate to="/" />;
    }

    const {data: game, isLoading: isGameLoading} = useGetGameQuery({gameId});
    const {data: incomeData} = useGetIncomeQuery();
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const [loadAccount,{}] = useLazyGetAccountQuery();
    const [deleteAccount,{}] = useDeleteAccountMutation();
    const {data: roller, isLoading: isRollerLoading} = useGetRollerQuery();
    const [image, setImage] = useState<File | null>(null)
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
        images: "",
        login: "",
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
            setAccount(prev => ({
                ...prev,
                roller: roller.code,
                email: `${roller.code.toLowerCase()}.@exzork.me`
            }));
        }
    }, [roller?.code]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!roller?.code) return;
        const prefix = roller.code.toLowerCase() + '.';
        const value = e.target.value.replace('@exzork.me', '');
        setAccount(prev => ({
            ...prev,
            email: `${prefix}${value}@exzork.me`
        }));
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
                <div className='bg-gray-900 dark:bg-gray-800 h-[10vh] flex justify-between items-center px-12'>
                    <div className="text-xl md:text-3xl font-semibold text-white">
                        ExZork Shop | {game?.name} Account
                    </div>
                    {incomeData?.data && (
                        <div className="text-white text-right">
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
                <div className="mx-12 flex flex-1 flex-col lg:flex-row">
                    <div className={`bg-white dark:bg-gray-800 py-4 flex-1 my-8 transition-all duration-300 ${filterOpen ? 'min-w-96 max-w-96' : 'w-0 min-w-0 max-w-0 overflow-hidden px-0 py-0'}`}> 
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
                                theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary: '#4B5563',
                                        primary75: '#6B7280',
                                        primary50: '#9CA3AF',
                                        primary25: '#D1D5DB',
                                        neutral0: '#FFFFFF',
                                        neutral5: '#F3F4F6',
                                        neutral10: '#E5E7EB',
                                        neutral20: '#D1D5DB',
                                        neutral30: '#9CA3AF',
                                        neutral40: '#6B7280',
                                        neutral50: '#4B5563',
                                        neutral60: '#374151',
                                        neutral70: '#1F2937',
                                        neutral80: '#111827',
                                        neutral90: '#000000',
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
                        <div className="px-4 py-2 flex space-x-2">
                            <button className={`${account.gender === "F" ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} p-2 rounded transition-colors`} onClick={() => {
                                setAccount({...account!, gender: "F"})}
                            }>Female</button>
                            <button className={`${account.gender === "M" ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} p-2 rounded transition-colors`} onClick={() => {
                                setAccount({...account!, gender: "M"})}}
                            >Male</button>
                        </div>
                        <div className="px-4 py-2 flex items-center space-x-2">
                            <div className="text-gray-900 dark:text-gray-100">USD</div>
                            <input type="number" placeholder="Price" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setAccount({...account!, price: parseInt(e.target.value)})} value={account.price}/>
                        </div>
                        <div className="px-4 py-2">
                            <FileUploader multiple={false} handleChange={async(file:File) => {
                                setImage(file)
                            }}/>
                            {image && <Image src={URL.createObjectURL(image)} alt="" className="h-40 aspect-video"/>}
                        </div>
                        <div className="px-4 py-2">
                            <label className='font-semibold text-gray-900 dark:text-gray-100'>Characters</label>
                            <div className='flex flex-wrap gap-2 mb-2'>
                                {game?.characters.map((character) => {
                                    let selected = account.characters.some((c) => c.character === character.value)
                                    let multiC = account.characters.filter((c) => c.character === character.value).length > 1
                                    return (
                                        <>
                                            <div className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative'} onClick={() => {
                                                if(account.characters.some((c) => c.character === character.value)){
                                                    setAccount({...account!, characters: account.characters.filter((c) => c.character !== character.value)})
                                                }else{
                                                    setAccount({...account!, characters: [...account.characters, {character: character.value, copies: 0, level: 1}]})
                                                }
                                            }} data-tooltip-id='tooltip-characters' data-tooltip-content={character.name} data-tooltip-place='top'>
                                                {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{account.characters.filter((c) => c.character === character.value).length-1}</div>}
                                                {selected && (
                                                    <button className='absolute top-0 right-0 bg-black/50 dark:bg-white/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                        e.stopPropagation()
                                                        setAccount({...account!, characters: account.characters.filter((c) => c.character !== character.value)})
                                                    }}>-</button>
                                                )}
                                                <Image src={character.image} alt="" className='w-16'/>
                                            </div>
                                        </>
                                    )
                                })}
                                <Tooltip id='tooltip-characters' place='top'/>
                            </div>
                            <label className='font-semibold text-gray-900 dark:text-gray-100'>Weapons</label>
                            <div className='flex flex-wrap gap-2'>
                                {game?.weapons.map((weapon) => {
                                    let selected = account.weapons.some((w) => w.weapon === weapon.value)
                                    let multiC = account.weapons.filter((w) => w.weapon === weapon.value).length > 1
                                    return (
                                        <>
                                            <div className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative'} onClick={() => {
                                                if(account.weapons.some((w) => w.weapon === weapon.value)){
                                                    setAccount({...account!, weapons: account.weapons.filter((w) => w.weapon !== weapon.value)})
                                                }else{
                                                    setAccount({...account!, weapons: [...account.weapons, {weapon: weapon.value, copies: 0, level: 1}]})
                                                }
                                            }} data-tooltip-id='tooltip-weapons' data-tooltip-content={weapon.name} data-tooltip-place='top'>
                                                {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{account.weapons.filter((w) => w.weapon === weapon.value).length-1}</div>}
                                                {selected && (
                                                    <button className='absolute top-0 right-0 bg-black/50 dark:bg-white/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                        e.stopPropagation()
                                                        setAccount({...account!, weapons: account.weapons.filter((w) => w.weapon !== weapon.value)})
                                                    }}>-</button>
                                                )}
                                                <Image src={weapon.image} alt="" className='w-16'/>
                                            </div>
                                        </>
                                    )
                                })}
                                <Tooltip id='tooltip-weapons' place='top'/>
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <div className="relative">
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                                        {roller?.code?.toLowerCase() || ''}.
                                    </span>
                                    <input 
                                        type="text" 
                                        placeholder="email" 
                                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500" 
                                        value={(() => {
                                            if (!roller?.code || !account.email) return '';
                                            const prefix = roller.code.toLowerCase() + '.';
                                            const email = account.email.replace('@exzork.me', '');
                                            return email.startsWith(prefix) 
                                                ? email.slice(prefix.length) 
                                                : email;
                                        })()}
                                        onChange={handleEmailChange}
                                    />
                                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                                        @exzork.me
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Password" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setAccount({...account!, password: e.target.value})} value={account.password}/>
                        </div>
                        <div className="px-4 py-2">
                            <button className={`bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white w-full p-2 rounded transition-colors ${loading ? `hidden`:`block`}`} disabled={loading} onClick={async() => {
                                if(!image && account.id === undefined){
                                    Swal.fire({
                                        title: 'Error',
                                        text: 'Please upload an image.',
                                        icon: 'error',
                                        confirmButtonText: 'Ok'
                                    })
                                    return
                                }
                                setLoading(true)
                                let acc0 = {...account}
                                if(image){
                                    let url = await uploadImage(image)
                                    acc0.images = url
                                }
                                await addAccount({account: acc0}).unwrap();
                                setLoading(false)
                                setAccount({
                                    game_id: account.game_id,
                                    server_name: "",
                                    level: 1,
                                    banner_guarantee: false,
                                    code: "",
                                    description: "",
                                    price: 0,
                                    roller: roller?.code ?? "",
                                    images: "",
                                    login: "",
                                    characters: [],
                                    weapons: [],
                                    email: "",
                                    password: "",
                                    gender: "F",
                                    recovery_email: ""
                                })
                            }}>{account.id ? "Edit" : "Add"} Account</button>
                        </div>
                        </>
                        )}
                    </div>
                    <div className='lg:ml-12 ml-0 my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh] w-full flex-col'>
                        {!filterOpen && (
                            <div className="flex justify-start mb-4 w-full">
                                <button onClick={() => setFilterOpen(true)} className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-2 rounded-md font-semibold shadow hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200">
                                    Add Account
                                </button>
                            </div>
                        )}
                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-6 min-h-[400px] flex items-start">
                            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-8 w-full">
                                {accounts?.map((item, index) => (
                                    <div key={index} className="transform transition-all duration-200 hover:scale-[1.02] col-span-2">
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
                                                {item.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-auto">
                                                    {item.characters.map((character, index) => (
                                                        <span className='bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium' key={index}>
                                                            {character.character}{character.copies > 0 && ` (C${character.copies})`}
                                                        </span>
                                                    ))}
                                                    {item.weapons.map((weapon, index) => (
                                                        <span className='bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium' key={index}>
                                                            {weapon.weapon}{weapon.copies > 0 && ` (C${weapon.copies})`}
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