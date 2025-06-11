import Select from 'react-select';
import {useGetGameQuery, useLazyGetAccountsQuery, useGetIncomeQuery} from '../services/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function AccountPage(){
    const navigate = useNavigate()
    const { gameId } = useParams()
    const [params, setParams] = useState<{[key: string]: string}>({})
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const {data: game} = useGetGameQuery({gameId: parseInt(gameId!)});
    const {data: incomeData} = useGetIncomeQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

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

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            <div className='bg-gray-900 h-[10vh] flex justify-between items-center px-12'>
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
                    {isAuthenticated && incomeData?.data && (
                        <div className="text-white text-right">
                            <div className="text-sm text-gray-300">Total Income</div>
                            <div className="text-xl font-semibold">
                                ${incomeData.data.find(income => income.game_id === parseInt(gameId!))?.total_income.toFixed(2) ?? '0.00'}
                            </div>
                            <div className="text-sm text-gray-300">
                                {incomeData.data.find(income => income.game_id === parseInt(gameId!))?.total_sold ?? 0} accounts sold
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mx-12 flex flex-1 flex-col lg:flex-row">
                <div className="bg-white px-2 py-4 flex-1 my-8 min-w-96 max-w-96">
                <div className="flex justify-between items-center px-4 py-2 border-b">
                    <div className="text-lg font-semibold">Filters</div>
                </div>
                <div className="px-4 py-2">
                    <Select 
                    isSearchable
                    isMulti
                    placeholder="Server"
                    name='server'
                    className='w-full'
                    onChange={(selectedOption) => {
                        if(selectedOption){
                            setParams({...params, servers: selectedOption.map((option) => option.value).join(',')})
                        }
                    }}
                    options={game?.servers.map((server) => ({label: server.name, value: server.value}))}/>
                </div>
                <div className='px-4 py-2'>
                    <Select 
                    isSearchable
                    placeholder="Gender"
                    name='Gender'
                    className='w-full'
                    onChange={(selectedOption) => {
                        if(selectedOption){
                            setParams({...params, gender: selectedOption.value})
                        }
                    }}
                    options={[{label: 'Female', value: 'F'}, {label: 'Male', value: 'M'}]}/>
                </div>
                <div className="px-4 pb-2">
                    <div>
                        <label className='font-semibold'>Characters</label>
                        <div className='flex flex-wrap gap-2 mb-2'>
                            {game?.characters.map((character) => {
                                let selected = params.characters?.split(',').includes(character.value)
                                let multiC = params.characters?.split(',').filter((c) => c === character.name).length > 1
                                return (
                                    <>
                                        <div className={(selected ? 'bg-yellow-300' : 'bg-black/25') + ' relative'} onClick={() => {
                                            if(params.characters){
                                                setParams({...params, characters: params.characters + ',' + character.value})
                                            }else{
                                                setParams({...params, characters: character.value})
                                            }
                                        }} data-tooltip-id='tooltip-characters' data-tooltip-content={character.name} data-tooltip-place='top'>
                                            {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{params.characters?.split(',').filter((c) => c === character.name).length-1}</div>}
                                            {selected && (
                                                <button className='absolute top-0 right-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                    e.stopPropagation()
                                                    let characters = params.characters?.split(',')
                                                    characters?.splice(characters?.indexOf(character.name),1)
                                                    setParams({...params, characters: characters?.join(',')})
                                                }}>-</button>
                                            )}
                                            <img src={character.image} alt="" className='w-16'/>
                                        </div>
                                    </>
                                )
                            })}
                            <Tooltip id='tooltip-characters' place='top'/>
                        </div>
                        <label className='font-semibold'>Weapons</label>
                        <div className='flex flex-wrap gap-2'>
                            {game?.weapons.map((weapon) => {
                                let selected = params.weapons?.split(',').includes(weapon.value)
                                let multiC = params.weapons?.split(',').filter((c) => c === weapon.name).length > 1
                                return (
                                    <>
                                        <div className={(selected ? 'bg-yellow-300' : 'bg-black/25') + ' relative'} onClick={() => {
                                            if(params.weapons){
                                                setParams({...params, weapons: params.weapons + ',' + weapon.value})
                                            }else{
                                                setParams({...params, weapons: weapon.value})
                                            }
                                        }} data-tooltip-id='tooltip-weapons' data-tooltip-content={weapon.name} data-tooltip-place='top'>
                                            {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{params.weapons?.split(',').filter((c) => c === weapon.name).length-1}</div>}
                                            {selected && (
                                                <button className='absolute top-0 right-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                    e.stopPropagation()
                                                    let weapons = params.weapons?.split(',')
                                                    weapons?.splice(weapons?.indexOf(weapon.name),1)
                                                    setParams({...params, weapons: weapons?.join(',')})
                                                }}>-</button>
                                            )}
                                            <img src={weapon.image} alt="" className='w-16'/>
                                        </div>
                                    </>
                                )
                            })}
                            <Tooltip id='tooltip-weapons' place='top'/>
                        </div>
                    </div>
                </div>
                
                </div>
                <div className='lg:ml-12 ml-0 my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh]'>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full mr-2">
                    {accounts?.map((item, index) => (
                    <div key={index} className="">
                        <div className='bg-white p-2 space-y-2'>
                            <div className="flex md:flex-row flex-col justify-between md:items-center items-start">
                                <div className="text-xs font-semibold">{game?.servers.find(server => server.value === item.server_name)?.name} | {item.code}</div>
                                <div className="flex items-center gap-2">
                                    {isAuthenticated ? (
                                        item.transaction_status && (
                                            <div className={`px-2 py-1 rounded text-white text-xs ${getStatusColor(item.transaction_status)}`}>
                                                {item.transaction_status}
                                            </div>
                                        )
                                    ) : (
                                        <button className="bg-gray-900 text-white p-2 rounded" onClick={() => {
                                            navigate(`/games/${gameId}/accounts/${item.id}`)
                                        }}>Buy (${item.price})</button>
                                    )}
                                </div>
                            </div>
                            <div className='flex flex-col space-x-2 sm:space-y-2'>
                                <img src={item.images} alt="" className="h-40 aspect-video flex-1"/>
                                <div className='space-y-2 flex-1'>
                                    <div className="flex space-x-1">
                                        <div className="font-semibold text-xs border-r border-[#CCC] pr-2">Rate {item.banner_guarantee ? 'On' : 'Off'}</div>
                                        <div className="text-xs w-11/12"> {item.description}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.characters.map((character, index) => (
                                            <span className='bg-black/10 px-2 py-1 rounded' key={index}>{character.character}  {character.copies > 0 && `(C${character.copies})`}</span>
                                        ))}
                                        {item.weapons.map((weapon, index) => (
                                            <span className='bg-black/10 px-2 py-1 rounded' key={index}>{weapon.weapon}  {weapon.copies > 0 && `(C${weapon.copies})`}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
    )
}