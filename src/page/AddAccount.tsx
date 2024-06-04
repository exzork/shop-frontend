import { useState, useEffect } from "react";
import { uploadImage, useAddAccountMutation, useGetGameQuery, useGetRollerQuery, useLazyGetAccountsQuery } from "../services/api";
import { Account } from "../services/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Select from 'react-select';
import { FileUploader } from "react-drag-drop-files";

export default function AddAccountPage(){
    const navigate = useNavigate()
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});
    const [gameId, {}] = useState<number>(parseInt(useParams().gameId!))
    const [loadAccounts,{data: accounts}] = useLazyGetAccountsQuery();
    const [searchParams, {}] = useSearchParams();
    const token = searchParams.get("token");
    const {data: roller} = useGetRollerQuery({token: token ?? ""});
    const [image, setImage] = useState<File | null>(null)
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
        gender: "F"
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
                            <div className="text-lg font-semibold">Add Account | {roller?.name}</div>
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
                            <input type="text" placeholder="Level" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, level: parseInt(e.target.value)})}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="checkbox" className="mr-2" onChange={(e) => setAccount({...account!, banner_guarantee: e.target.checked})} id="banner_guarantee"/>
                            <label htmlFor="banner_guarantee">Banner Guarantee</label>
                        </div>
                        <div className="px-4 py-2">
                            <textarea placeholder="Description" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, description: e.target.value})}></textarea>
                        </div>
                        <div className="px-4 py-2">
                            <button className={ "bg-gray-900 text-white p-2 rounded"} 
                                onClick={() => {
                                    if(account.gender === "F"){
                                        setAccount({...account, gender: "M"})
                                    }else{
                                        setAccount({...account, gender: "F"})
                                    }
                                }}
                            >
                                {account.gender === "F" ? "Female" : "Male"}
                            </button>
                        </div>
                        <div className="px-4 py-2">
                            <input type="number" placeholder="Price" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, price: parseInt(e.target.value)})}/>
                        </div>
                        <div className="px-4 py-2">
                            <FileUploader multiple={false} handleChange={async(file:File) => {
                                setImage(file)
                            }}/>
                            {image && <img src={URL.createObjectURL(image)} alt="" className="h-40 aspect-video"/>}
                        </div>
                        <div className="px-4 py-2 space-y-2">
                            <div className="flex flex-wrap gap-2">{account?.characters.map((character, index) => (
                                <button className='bg-black/10 px-2 py-1 rounded' key={index}
                                    onClick={() => {
                                        if(character.copies > 0){
                                            setAccount({...account!, characters: account?.characters.map((char) => char.character === character.character ? {...char, copies: char.copies - 1} : char)})
                                        }else{
                                            setAccount({...account!, characters: account?.characters.filter((char) => char.character !== character.character)})
                                        }
                                    }}
                                >{character.character}  {character.copies > 0 && `(C${character.copies})`}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {game?.characters.map((character, index) => (
                                    <button className="bg-gray-900 text-white p-2 rounded" key={index} onClick={() => {
                                        if(account?.characters.find((char) => char.character === character.value)){
                                            setAccount({...account!, characters: account?.characters.map((char) => char.character === character.value ? {...char, copies: char.copies + 1} : char)})
                                        }else{
                                            setAccount({...account!, characters: [...account?.characters, {character: character.value, level: 1, copies: 0}]})
                                        }
                                    }}>{character.name}</button>
                                ))}
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Login" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, login: e.target.value})}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="email" placeholder="Email" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, email: e.target.value})}/>
                        </div>
                        <div className="px-4 py-2">
                            <input type="text" placeholder="Password" className="w-full p-2 border border-gray-300 rounded" onChange={(e) => setAccount({...account!, password: e.target.value})}/>
                        </div>
                        <div className="px-4 py-2">
                            <button className="bg-gray-900 text-white w-full p-2 rounded" onClick={async() => {
                                let url = await uploadImage(image!, token!);
                                let acc = await addAccount({account: {...account, images: url}, token: token!}).unwrap();
                                if(acc.id){
                                    //reload window
                                    window.location.reload();
                                }
                            }}>Add Account</button>
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
                                    <div className="text-lg">Description: {item.description}</div>
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