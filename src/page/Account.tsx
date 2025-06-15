import Select from 'react-select';
import {useGetGameQuery, useLazyGetAccountsQuery, useGetIncomeQuery, useGetSalesStatsQuery} from '../services/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image } from '../components/Image';

export default function AccountPage(){
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

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
            <div className='bg-gray-900 dark:bg-gray-800 h-[10vh] flex justify-between items-center px-12'>
                <div className="text-xl md:text-3xl font-semibold text-white">
                    ExZork Shop | {game?.name} Account
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated && (
                        <Link 
                            to={`/games/${gameId}/add`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                        >
                            Add Account
                        </Link>
                    )}
                    {isAuthenticated ? (
                        incomeData?.data && (
                            <div className="text-white text-right">
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
                        <div className="text-white text-right">
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
            <div className="mx-12 flex flex-1 flex-col lg:flex-row relative">
                <div className={`bg-white dark:bg-gray-800 py-4 flex-1 my-8 transition-all duration-300 ${filterOpen ? 'min-w-96 max-w-96' : 'w-0 min-w-0 max-w-0 overflow-hidden px-0 py-0'}`}>
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
                        <div className="px-4 pb-2">
                            <div>
                                <label className='font-semibold text-gray-900 dark:text-gray-100'>Characters</label>
                                <div className='flex flex-wrap gap-2 mb-2'>
                                    {game?.characters.map((character) => {
                                        let selected = params.characters?.split(',').includes(character.value)
                                        let multiC = params.characters?.split(',').filter((c) => c === character.name).length > 1
                                        return (
                                            <>
                                                <div className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative'} onClick={() => {
                                                    if(params.characters){
                                                        setParams({...params, characters: params.characters + ',' + character.value})
                                                    }else{
                                                        setParams({...params, characters: character.value})
                                                    }
                                                }} data-tooltip-id='tooltip-characters' data-tooltip-content={character.name} data-tooltip-place='top'>
                                                    {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{params.characters?.split(',').filter((c) => c === character.name).length-1}</div>}
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
                                        let selected = params.weapons?.split(',').includes(weapon.value)
                                        let multiC = params.weapons?.split(',').filter((c) => c === weapon.name).length > 1
                                        return (
                                            <>
                                                <div className={(selected ? 'bg-yellow-300 dark:bg-yellow-600' : 'bg-black/25 dark:bg-white/25') + ' relative'} onClick={() => {
                                                    if(params.weapons){
                                                        setParams({...params, weapons: params.weapons + ',' + weapon.value})
                                                    }else{
                                                        setParams({...params, weapons: weapon.value})
                                                    }
                                                }} data-tooltip-id='tooltip-weapons' data-tooltip-content={weapon.name} data-tooltip-place='top'>
                                                    {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{params.weapons?.split(',').filter((c) => c === weapon.name).length-1}</div>}
                                                    {selected && (
                                                        <button className='absolute top-0 right-0 bg-black/50 dark:bg-white/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                            e.stopPropagation()
                                                            let weapons = params.weapons?.split(',')
                                                            weapons?.splice(weapons?.indexOf(weapon.name),1)
                                                            setParams({...params, weapons: weapons?.join(',')})
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
                        </div>
                        </>
                    )}
                </div>
                <div className='lg:ml-12 ml-0 my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh] w-full flex-col'>
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
                    ) : accounts?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Accounts Available</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                                {params && Object.keys(params).length > 0 
                                    ? "No accounts match your current filters. Try adjusting your search criteria."
                                    : "There are currently no accounts available for this game. Please check back later."}
                            </p>
                        </div>
                    ) : (
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
                                                {isAuthenticated ? (
                                                    item.transaction_status && (
                                                        <div className={`px-2 py-1 rounded text-white text-xs font-medium mb-2 ${getStatusColor(item.transaction_status)}`}>
                                                            {item.transaction_status}
                                                        </div>
                                                    )
                                                ) : (
                                                    <button 
                                                        className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium mb-2 w-full" 
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