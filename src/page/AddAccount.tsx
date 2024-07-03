import { useState, useEffect } from "react";
import { uploadImage, useAddAccountMutation, useDeleteAccountMutation, useGetGameQuery, useGetRollerQuery, useLazyGetAccountsQuery } from "../services/api";
import { Account } from "../services/types";
import { useParams, useSearchParams } from "react-router-dom";
import Select from 'react-select';
import { FileUploader } from "react-drag-drop-files";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";
import { CiEdit, CiTrash } from "react-icons/ci";

export default function AddAccountPage(){
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});
    const [gameId, {}] = useState<number>(parseInt(useParams().gameId!))
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const [deleteAccount,{}] = useDeleteAccountMutation();
    const [searchParams, {}] = useSearchParams();
    const token = searchParams.get("token");
    const {data: roller} = useGetRollerQuery({token: token ?? ""});
    const [image, setImage] = useState<File | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [account, setAccount] = useState<Account>({
        game_id: parseInt(useParams().gameId!),
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
    });
    const [addAccount,{}] = useAddAccountMutation();

    useEffect(() => {
        console.log(account)
    }, [account])

    useEffect(()=>{
        loadAccounts({gameId: gameId, query: {prefix: roller?.code}})
    },[roller])
    return (
        <>
            <div className="bg-gray-100 min-h-screen flex flex-col">
                <div className='bg-gray-900 h-[10vh] flex'>
                    <div className="text-xl md:text-3xl font-semibold ml-12 text-white my-auto">
                    ExZork Shop | {game?.name} Account
                    </div>
                </div>
                <div className="mx-12 flex flex-1 flex-col lg:flex-row">
                    <div className="bg-white px-2 py-4 flex-1 my-8 min-w-96 max-w-96">
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <div className="text-lg font-semibold">{account.id ? "Edit" : "Add"} Account | {roller?.name}</div>
                            <button className="bg-gray-900 text-white p-2 rounded" onClick={() => {
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
                            }}>Clear</button>
                        </div>
                        <div className="px-4 py-2">
                            <Select 
                                options={game?.servers.map((server) => ({label: server.name, value: server.value}))}
                                isSearchable
                                onChange={(selectedOption) => {
                                    if(selectedOption){
                                        setAccount({...account!, server_name: selectedOption.value})
                                    }
                                }}
                            />
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Level" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, level: parseInt(e.target.value)})} value={account.level}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="checkbox" className="mr-2" onChange={(e) => setAccount({...account!, banner_guarantee: e.target.checked})} id="banner_guarantee" checked={account.banner_guarantee}/>
                            <label htmlFor="banner_guarantee">Banner Guarantee</label>
                        </div>
                        <div className="px-4 py-2">
                            <textarea placeholder="Description" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, description: e.target.value})} value={account.description}/>
                        </div>
                        <div className="px-4 py-2 flex space-x-2">
                            <button className={`${account.gender === "F" ? 'bg-yellow-300' : 'bg-gray-200 text-white'} p-2 rounded`} onClick={() => {
                                setAccount({...account!, gender: "F"})}
                            }>Female</button>
                            <button className={`${account.gender === "M" ? 'bg-yellow-300' : 'bg-gray-200 text-white'} p-2 rounded`} onClick={() => {
                                setAccount({...account!, gender: "M"})}}
                            >Male</button>
                        </div>
                        <div className="px-4 py-2 flex items-center space-x-2">
                            <div>USD</div>
                            <input type="number" placeholder="Price" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, price: parseInt(e.target.value)})} value={account.price}/>
                        </div>
                        <div className="px-4 py-2">
                            <FileUploader multiple={false} handleChange={async(file:File) => {
                                setImage(file)
                            }}/>
                            {image && <img src={URL.createObjectURL(image)} alt="" className="h-40 aspect-video"/>}
                        </div>
                        <div className="px-4 py-2">
                            <label className='font-semibold'>Characters</label>
                            <div className='flex flex-wrap gap-2 mb-2'>
                                {game?.characters.map((character) => {
                                    let selected = account.characters?.find((c) => c.character === character.value)
                                    let multiC = account.characters?.filter((c) => c.character === character.value)[0]?.copies > 0
                                    return (
                                        <>
                                            <div className={(selected ? 'bg-yellow-300' : 'bg-black/25') + ' relative flex justify-center items-center'} onClick={() => {
                                                if(account?.characters.find((char) => char.character === character.value)){
                                                    setAccount({...account!, characters: account?.characters.map((char) => char.character === character.value ? {...char, copies: char.copies + 1} : char)})
                                                }else{
                                                    setAccount({...account!, characters: [...account?.characters, {character: character.value, level: 1, copies: 0}]})
                                                }
                                                console.log("clicked")
                                            }} data-tooltip-id='tooltip-characters' data-tooltip-content={character.name} data-tooltip-place='top'>
                                                {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{account.characters?.filter((c) => c.character === character.value)[0]?.copies}</div>}
                                                {selected && (
                                                    <button className='absolute top-0 right-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                        e.stopPropagation()
                                                        setAccount({...account!, characters: account?.characters.map((char) => char.character === character.value ? {...char, copies: char.copies - 1} : char)})
                                                        if (account?.characters.filter((char) => char.character === character.value)[0].copies === 0){
                                                            setAccount({...account!, characters: account?.characters.filter((char) => char.character !== character.value)})
                                                        }
                                                    }}>-</button>
                                                )}
                                                <img src={character.image} alt="" className='w-16'/>
                                            </div>
                                        </>
                                    )
                                })}
                                <Tooltip id='tooltip-characters' place='top'/>
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <label className='font-semibold'>Weapons</label>
                            <div className='flex flex-wrap gap-2 mb-2'>
                                {game?.weapons.map((weapon) => {
                                    let selected = account.weapons?.find((w) => w.weapon === weapon.value)
                                    let multiC = account.weapons?.filter((w) => w.weapon === weapon.value)[0]?.copies > 0
                                    return (
                                        <>
                                            <div className={(selected ? 'bg-yellow-300' : 'bg-black/25') + ' relative flex justify-center items-center'} onClick={() => {
                                                if(account?.weapons.find((w) => w.weapon === weapon.value)){
                                                    setAccount({...account!, weapons: account?.weapons.map((w) => w.weapon === weapon.value ? {...w, copies: w.copies + 1} : w)})
                                                }else{
                                                    setAccount({...account!, weapons: [...account?.weapons, {weapon: weapon.value, level: 1, copies: 0}]})
                                                }
                                                console.log("clicked")
                                            }} data-tooltip-id='tooltip-weapons' data-tooltip-content={weapon.name} data-tooltip-place='top'>
                                                {multiC && <div className='absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{account.weapons?.filter((w) => w.weapon === weapon.value)[0]?.copies}</div>}
                                                {selected && (
                                                    <button className='absolute top-0 right-0 bg-black/50 text-white text-xs rounded-full px-2 py-0.5' onClick={(e) => {
                                                        e.stopPropagation()
                                                        setAccount({...account!, weapons: account?.weapons.map((w) => w.weapon === weapon.value ? {...w, copies: w.copies - 1} : w)})
                                                        if (account?.weapons.filter((w) => w.weapon === weapon.value)[0].copies === 0){
                                                            setAccount({...account!, weapons: account?.weapons.filter((w) => w.weapon !== weapon.value)})
                                                        }
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
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Login" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, login: e.target.value})} value={account.login}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="email" placeholder="Email" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, email: e.target.value})} value={account.email}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Password" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, password: e.target.value})} value={account.password}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Recovery Email" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, recovery_email: e.target.value})} value={account.recovery_email}/>
                        </div>
                        <div className="px-4 py-2">
                            <button className={`bg-gray-900 text-white w-full p-2 rounded ${loading ? `hidden`:`block`}`} disabled={loading} onClick={async() => {
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
                                    let url = await uploadImage(image, token!)
                                    acc0.images = url
                                }
                                await addAccount({account: {...acc0}, token: token!}).unwrap();
                                setLoading(false)
                            }}>Add Account</button>
                        </div>
                    </div>
                    <div className='lg:ml-12 ml-0 my-8 flex flex-grow md:overflow-y-auto lg:h-[80vh]'>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full mr-2">
                            {accounts?.map((item, index) => (
                            <div key={index} className="">
                                <div className='bg-white p-2 space-y-2'>
                                    <div className="flex md:flex-row flex-col justify-between md:items-center items-start">
                                        <div className="text-xs font-semibold flex-1">{game?.servers.find(server => server.value === item.server_name)?.name} | ${item.price} | {item.code}</div>
                                        <button className="bg-gray-900 text-white p-2 rounded" onClick={() => {
                                            setAccount(item)
                                        }}>
                                            <CiEdit/>
                                        </button>
                                        <button className="bg-red-500 text-white p-2 rounded ml-1" onClick={async() => {
                                            //swal confirm
                                            Swal.fire({
                                                title: 'Are you sure?',
                                                text: 'You will not be able to recover this account!',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, delete it!',
                                                cancelButtonText: 'No, keep it'
                                            }).then(async(result) => {
                                                if(result.isConfirmed){
                                                    await deleteAccount({account: item, token: token!}).unwrap();
                                                }
                                            })
                                        }}>
                                            <CiTrash/>
                                        </button>
                                    </div>
                                    <div className='flex flex-col space-x-2 sm:space-y-2'>
                                        <img src={item.images} alt="" className="h-40 aspect-video flex-1"/>
                                        <div className='space-y-2 flex-1'>
                                            <div className="text-xs">Description: {item.description}</div>
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
        </>
    )
}