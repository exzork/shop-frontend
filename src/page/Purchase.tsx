import { useState } from "react"
import { Transaction } from "../services/types"
import { useParams } from "react-router-dom";
import { useCreateTransactionMutation, useGetAccountQuery, useGetGameQuery, useAuthorizeTransactionMutation } from "../services/api";
import Swal from "sweetalert2";
import { Image } from "../components/Image";
import { PayPalScriptProvider, PayPalButtons, ReactPayPalScriptOptions } from "@paypal/react-paypal-js";

export default function PurchasePage(){

    const initialOptions : ReactPayPalScriptOptions = {
        "clientId":"AdjBJg60oSySZNz3WT_Tvo4iv6uqGKypVyaBYDmc5rTsIUr0y22CO5_hJlXkV_VchuhWGb0kkPOkU2wW",
        "enable-funding": "venmo,card",
        "disable-funding": "paylater",
        "buyer-country": "US",
        currency: "USD",
        "data-page-type": "product-details",
        components: "buttons",
        "data-sdk-integration-source": "developer-studio",
        environment: "sandbox",
        intent: "authorize",
    };

    
    const [transaction, setTransaction] = useState<Transaction>({account_id: parseInt(useParams().accountId!), name: '', email: '', note: ''})
    const {data: account} = useGetAccountQuery({gameId: parseInt(useParams().gameId!), accountId: parseInt(useParams().accountId!)})
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});
    const [createTransaction] = useCreateTransactionMutation();
    const [authorizeTransaction] = useAuthorizeTransactionMutation();
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
                        <div className="flex flex-col space-y-4">
                            {account?.images.map((image, index) => (
                                <Image key={index} src={image} alt="" className="w-full rounded-lg"/>
                            ))}
                        </div>
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
                                        <Image src={game?.weapons.find((weap) => weap.value === weapon.weapon)?.image || ''} alt="" className="w-24 bg-yellow-300 dark:bg-yellow-600"/>
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
                    <div className="px-4 py-6 flex justify-center">
                        <div className="w-full max-w-md">
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{
                                        shape: "rect",
                                        layout: "vertical",
                                        color: "gold",
                                        label: "paypal",
                                    }}
                                    createOrder={async () => {
                                        try {
                                            const result = await createTransaction(transaction).unwrap()
                                            return result.order.id
                                        } catch (error: any) {
                                            Swal.fire({
                                                title: 'Error',
                                                text: error?.data?.message || error?.message || 'Something went wrong',
                                                icon: 'error',
                                                confirmButtonText: 'Ok'
                                            })
                                            throw error;
                                        }
                                    }}
                                    onApprove={async (data, actions) => {
                                        try {
                                            const orderData = await authorizeTransaction({ order_id: data.orderID }).unwrap();

                                            const errorDetail = orderData?.details?.[0];

                                            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                                                return actions.restart();
                                            } else if (errorDetail) {
                                                throw new Error(
                                                    `${errorDetail.description} (${orderData.debug_id})`
                                                );
                                            } else {
                                                Swal.fire({
                                                    title: 'Success',
                                                    text: `Payment authorized. Your order is being processed and account details will be sent to your email once delivery is complete.`,
                                                    icon: 'success',
                                                    confirmButtonText: 'Ok'
                                                })
                                            }
                                        } catch (error: any) {
                                            console.error(error);
                                            Swal.fire({
                                                title: 'Error',
                                                text: error?.data?.message || error?.message || 'Something went wrong',
                                                icon: 'error',
                                                confirmButtonText: 'Ok'
                                            })
                                        }
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                    </div>


                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        <ul className="list-disc">
                            <li>This is last step of the purchase. Please make sure you have filled the form correctly.</li>
                            <li>We will send you a confirmation to your email. Please authorize the payment to proceed.</li>
                            <li>You can have maximum 3 times of cancellation for each account, this is to prevent spamming and holding an account.</li>
                            <li>After you have authorized the payment, please wait for the account to be delivered to your email. (Usually within 5 minutes)</li>
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