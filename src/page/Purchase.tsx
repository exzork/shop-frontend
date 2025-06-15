import { useState } from "react"
import { Transaction } from "../services/types"
import { useParams } from "react-router-dom";
import { useCreateTransactionMutation, useGetAccountQuery, useGetGameQuery } from "../services/api";
import Swal from "sweetalert2";
import { Image } from "../components/Image";

export default function PurchasePage(){
    const [transaction, setTransaction] = useState<Transaction>({account_id: parseInt(useParams().accountId!), name: '', email: '', note: ''})
    const {data: account} = useGetAccountQuery({gameId: parseInt(useParams().gameId!), accountId: parseInt(useParams().accountId!)})
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});
    const [loading, setLoading] = useState<boolean>(false)
    const [createTransaction] = useCreateTransactionMutation();
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
            <div className='bg-gray-900 dark:bg-gray-800 h-[10vh] flex'>
                <div className="text-xl md:text-3xl font-semibold ml-12 text-white my-auto">
                ExZork Shop | Purchase
                </div>
            </div>
            <div className="mx-12 flex flex-1 flex-col lg:flex-row">
                <div className="bg-white dark:bg-gray-800 px-2 py-4 flex-1 my-8 max-w-7xl mx-auto">
                    <div>
                        <Image src={account?.images || ''} alt="" className="w-full"/>
                        <div className="px-4 py-2 space-y-2">
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Login Method : {account?.login}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{account?.description}</div>
                            <div className="flex justify-start gap-4 items-center">
                                {account?.characters.map((character) => (
                                    <div key={character.id} className="relative">
                                        <Image src={game?.characters.find((char) => char.value === character.character)?.image || ''} alt="" className="w-24 bg-yellow-300 dark:bg-yellow-600"/>
                                        {character.copies >= 1 && <div className='absolute bottom-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{character.copies}</div>}
                                    </div>
                                ))}
                                {account?.weapons.map((weapon) => (
                                    <div key={weapon.id} className="relative">
                                        <Image src={game?.weapons.find((weapon) => weapon.value === weapon.name)?.image || ''} alt="" className="w-24 bg-yellow-300 dark:bg-yellow-600"/>
                                        {weapon.copies >= 1 && <div className='absolute bottom-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-0.5'>C{weapon.copies}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Purchase</div>
                    </div>
                    <div className="px-4 py-2">
                        <input type="text" required placeholder="Your Name" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setTransaction({...transaction, name: e.target.value})}/>
                    </div>
                    <div className="px-4 py-2">
                        <input type="email" required placeholder="Your Email" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setTransaction({...transaction, email: e.target.value})}/>
                    </div>
                    <div className="px-4 py-2">
                        <textarea placeholder="Note, usually your discord for communication if necessary." className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" onChange={(e) => setTransaction({...transaction, note: e.target.value})}/>
                    </div>
                    <div className="px-4 py-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full transition-colors" disabled={loading} onClick={async() => {
                            if(transaction.name === '' || transaction.email === ''){
                                await Swal.fire({
                                    title: 'Error',
                                    text: 'Please fill the form correctly.',
                                    icon: 'error',
                                    confirmButtonText: 'Ok'
                                })
                                return
                            }
                            setLoading(true)
                            try {
                                const result = await createTransaction(transaction).unwrap()
                                if(result) {
                                    await Swal.fire({
                                        title: 'Success',
                                        text: 'Transaction has been created, please check your email for the invoice.',
                                        icon: 'success',
                                        confirmButtonText: 'Ok'
                                    })
                                }
                            } finally {
                                setLoading(false)
                            }
                        }}>Purchase | ${account?.price}</button>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        <ul className="list-disc">
                            <li>This is last step of the purchase. Please make sure you have filled the form correctly.</li>
                            <li>We will send you an invoice to your email. Please pay the invoice within 5 minutes to avoid cancellation.</li>
                            <li>You can have maximum 3 times of cancellation for each account, this is to prevent spamming and holding an account.</li>
                            <li>After you have paid the invoice, please wait for the account to be delivered to your email. (Usually within 5 minutes)</li>
                            <li>Account will be delivered with the login method, both email and login method password is the same. (Example: Kurogames login password and gmail password is the same)</li>
                            <li>This is a digital product, there is no refund after the account has been delivered except if the account is not as described.</li>
                            <li>If you have any question, please contact me on discord: exzork</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}