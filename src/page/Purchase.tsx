import { useState, useEffect, useCallback } from "react"
import { Transaction } from "../services/types"
import { useParams } from "react-router-dom";
import { useCreateTransactionMutation, useGetAccountQuery, useGetGameQuery, useAuthorizeTransactionMutation } from "../services/api";
import Swal from "sweetalert2";
import { Image } from "../components/Image";
import { PayPalScriptProvider, PayPalButtons, ReactPayPalScriptOptions } from "@paypal/react-paypal-js";

export default function PurchasePage(){

    const initialOptions : ReactPayPalScriptOptions = {
        "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        "enable-funding": "venmo,card",
        "disable-funding": "paylater",
        currency: "USD",
        "data-page-type": "product-details",
        components: "buttons",
        "data-sdk-integration-source": "developer-studio",
        environment: "production",
        intent: "authorize",
    };

    
    const [transaction, setTransaction] = useState<Transaction>({account_id: parseInt(useParams().accountId!), name: '', email: '', note: ''})
    const {data: account, isError : accountError} = useGetAccountQuery({gameId: parseInt(useParams().gameId!), accountId: parseInt(useParams().accountId!)})
    const {data: game} = useGetGameQuery({gameId: parseInt(useParams().gameId!)});
    const [createTransaction] = useCreateTransactionMutation();
    const [authorizeTransaction] = useAuthorizeTransactionMutation();

    const accountId = parseInt(useParams().accountId!);

    // Payment state - initialize from localStorage if available
    const getStoredPayment = () => {
        try {
            const stored = localStorage.getItem(`payment_${accountId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
                const remaining = 300 - elapsed;
                if (remaining > 0) {
                    return {
                        orderId: parsed.orderId as string,
                        transactionId: parsed.transactionId as number,
                        remaining: remaining,
                    };
                } else {
                    // Expired, clean up
                    localStorage.removeItem(`payment_${accountId}`);
                }
            }
        } catch {}
        return null;
    };

    const storedPayment = getStoredPayment();
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(storedPayment?.orderId ?? null);
    const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(storedPayment?.transactionId ?? null);
    const [timerSeconds, setTimerSeconds] = useState(storedPayment?.remaining ?? 300);
    const [timerActive, setTimerActive] = useState(!!storedPayment?.orderId);
    const [paymentCancelled, setPaymentCancelled] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    const savePaymentToStorage = (orderId: string, transactionId: number) => {
        localStorage.setItem(`payment_${accountId}`, JSON.stringify({
            orderId,
            transactionId,
            startedAt: Date.now(),
        }));
    };

    const clearPaymentStorage = () => {
        localStorage.removeItem(`payment_${accountId}`);
    };

    // Timer countdown
    useEffect(() => {
        if (!timerActive || timerSeconds <= 0) {
            if (timerSeconds <= 0 && timerActive) {
                setTimerActive(false);
                clearPaymentStorage();
            }
            return;
        }
        const interval = setInterval(() => {
            setTimerSeconds(prev => {
                if (prev <= 1) {
                    setTimerActive(false);
                    clearPaymentStorage();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive, timerSeconds]);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleCreateOrder = async () => {
        try {
            if (pendingOrderId) {
                return pendingOrderId;
            }
            const result = await createTransaction(transaction).unwrap();
            setPendingOrderId(result.order.id);
            setPendingTransactionId(result.transaction.id);
            savePaymentToStorage(result.order.id, result.transaction.id);
            setTimerSeconds(300);
            setTimerActive(true);
            setPaymentCancelled(false);
            return result.order.id;
        } catch (error: any) {
            Swal.fire({
                title: 'Error',
                text: error?.data?.message || error?.message || 'Something went wrong',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            throw error;
        }
    };

    const handleApprove = async (data: any, actions: any) => {
        try {
            const orderData = await authorizeTransaction({ order_id: data.orderID }).unwrap();
            const errorDetail = orderData?.details?.[0];

            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                return actions.restart();
            } else if (errorDetail) {
                throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
            } else {
                setPaymentCompleted(true);
                setTimerActive(false);
                clearPaymentStorage();
                Swal.fire({
                    title: 'Success',
                    text: `Payment authorized. Your order is being processed and account details will be sent to your email.`,
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                title: 'Error',
                text: error?.data?.message || error?.message || 'Something went wrong',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    };

    const handleCancel = () => {
        setPaymentCancelled(true);
    };

    const handleContinuePayment = () => {
        setPaymentCancelled(false);
    };

    if(accountError){
        return (
            ///make fullpage error
            <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <div className="text-xl md:text-3xl font-semibold text-red-500">
                    {"Account not found or has been sold"}
                </div>
            </div>
        )
    }

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
                    <div className="px-4 py-6 flex flex-col items-center">
                        {/* Price Display */}
                        {account && (
                            <div className="mb-4 text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Price</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${account.price.toFixed(2)} <span className="text-lg font-normal text-gray-500">USD</span></div>
                            </div>
                        )}

                        {/* Timer Display */}
                        {timerActive && pendingOrderId && (
                            <div className="mb-4 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-center">
                                <div className="text-sm text-yellow-700 dark:text-yellow-300">⏱ Time remaining to complete payment</div>
                                <div className={`text-2xl font-mono font-bold ${timerSeconds <= 60 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-300'}`}>
                                    {formatTime(timerSeconds)}
                                </div>
                                {pendingTransactionId && (
                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Transaction #{pendingTransactionId}</div>
                                )}
                            </div>
                        )}

                        {/* Timer Expired */}
                        {timerSeconds === 0 && pendingOrderId && !paymentCompleted && (
                            <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-center">
                                <div className="text-sm text-red-700 dark:text-red-300">⚠️ Payment time has expired. The transaction has been cancelled.</div>
                            </div>
                        )}

                        {/* Payment Completed */}
                        {paymentCompleted && (
                            <div className="mb-4 px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-center">
                                <div className="text-sm text-green-700 dark:text-green-300">✅ Payment authorized! Account details will be sent to your email.</div>
                            </div>
                        )}

                        {/* Continue Payment Button (shown when popup was dismissed) */}
                        {paymentCancelled && pendingOrderId && timerSeconds > 0 && !paymentCompleted && (
                            <div className="mb-4 w-full max-w-md">
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-center mb-3">
                                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">You dismissed the PayPal window, but your transaction is still locked.</div>
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                                        onClick={handleContinuePayment}
                                    >
                                        Continue Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PayPal Buttons */}
                        {!paymentCompleted && timerSeconds > 0 && !paymentCancelled && (
                            <div className="w-full max-w-md bg-white">
                                <PayPalScriptProvider options={initialOptions}>
                                    <PayPalButtons
                                        style={{
                                            shape: "rect",
                                            layout: "vertical",
                                            color: "gold",
                                            label: pendingOrderId ? "paypal" : "paypal",
                                        }}
                                        createOrder={handleCreateOrder}
                                        onApprove={handleApprove}
                                        onCancel={handleCancel}
                                    />
                                </PayPalScriptProvider>
                            </div>
                        )}
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