import Select from 'react-select';
import {useGetGameQuery, useLazyGetAccountsQuery } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
export default function AccountPage(){
    const navigate = useNavigate()
    const [gameId, _] = useState<number>(parseInt(useParams().gameId!))
    const [params, setParams] = useState<{[key: string]: string}>({})
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});

    useEffect(() => {
        loadAccounts({gameId: gameId, query: params})
        console.log(params)
    }, [params])

    useEffect(()=>{
        document.title = `ExZork Shop | ${game?.name} Accounts`
    },[game])

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            <div className='bg-gray-900 h-[10vh] flex'>
                <div className="text-xl md:text-3xl font-semibold ml-12 text-white my-auto">
                ExZork Shop | {game?.name} Accounts
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
                                        }}>
                                            {multiC && <div className='absolute bottom-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{params.characters?.split(',').filter((c) => c === character.name).length-1}</div>}
                                            {selected && (
                                                <button className='absolute top-0 right-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                    e.stopPropagation()
                                                    let characters = params.characters?.split(',')
                                                    characters?.splice(characters?.indexOf(character.name),1)
                                                    setParams({...params, characters: characters?.join(',')})
                                                }}>-</button>
                                            )}
                                            <div className='absolute bottom-0 left-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5'>{character.name}</div>
                                            <img src={character.image} alt="" className='w-24'/>
                                        </div>
                                    </>
                                )
                            })}
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
                                <div className="text-lg font-semibold">Server: {game?.servers.find(server => server.value === item.server_name)?.name} | Code: {item.code}</div>
                                <button className="bg-gray-900 text-white p-2 rounded" onClick={() => {
                                    navigate(`/games/${gameId}/accounts/${item.id}`)
                                }}>Buy (${item.price})</button>
                            </div>
                            <div className='flex flex-col space-x-2 sm:space-y-2'>
                                <img src={item.images} alt="" className="h-40 aspect-video flex-1"/>
                                <div className='space-y-2 flex-1'>
                                    <div className="flex space-x-1">
                                        <div className="font-semibold">Rate {item.banner_guarantee ? 'On' : 'Off'}</div>
                                        <div className="font-semibold"> | </div>
                                        <div className="font-semibold">{item.description}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">{item.characters.map((character, index) => (
                                        <span className='bg-black/10 px-2 py-1 rounded' key={index}>{character.character}  {character.copies > 0 && `(C${character.copies})`}</span>
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