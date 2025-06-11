import { useGetGamesQuery, useGetIncomeQuery } from "../services/api";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function HomePage() {
    const { data: games } = useGetGamesQuery();
    const { data: incomeData } = useGetIncomeQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className='bg-gray-900 h-[10vh] flex justify-between items-center px-12'>
                <div className="text-xl md:text-3xl font-semibold text-white">
                    ExZork Shop
                </div>
                {isAuthenticated && incomeData?.data && (
                    <div className="text-white text-right">
                        <div className="text-sm text-gray-300">Total Income</div>
                        <div className="text-xl font-semibold">
                            ${incomeData.data.reduce((sum, game) => sum + game.total_income, 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-300">
                            {incomeData.data.reduce((sum, game) => sum + game.total_sold, 0)} accounts sold
                        </div>
                    </div>
                )}
            </div>
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games?.map((game) => (
                        <Link 
                            key={game.id} 
                            to={`/games/${game.id}`}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="aspect-video relative">
                                <img 
                                    src={game.image} 
                                    alt={game.name} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{game.name}</h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {game.servers.map((server, index) => (
                                        <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                            {server.name}
                                        </span>
                                    ))}
                                </div>
                                {isAuthenticated && incomeData?.data && (
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Income:</span>
                                            <span className="font-semibold text-gray-800">
                                                ${incomeData.data.find(income => income.game_id === game.id)?.total_income.toFixed(2) ?? '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-gray-500">Accounts Sold:</span>
                                            <span className="font-semibold text-gray-800">
                                                {incomeData.data.find(income => income.game_id === game.id)?.total_sold ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
} 