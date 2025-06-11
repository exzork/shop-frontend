import { useGetGamesQuery, useGetIncomeQuery, useGetSalesStatsQuery } from "../services/api";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function HomePage() {
    const { data: games, isLoading } = useGetGamesQuery();
    const { data: incomeData } = useGetIncomeQuery();
    const { data: salesStats } = useGetSalesStatsQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const totalSold = salesStats?.reduce((sum, stat) => sum + stat.total_sold, 0) ?? 0;
    const totalRevenue = salesStats?.reduce((sum, stat) => sum + stat.total_revenue, 0) ?? 0;

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className='bg-gray-900 h-[10vh] flex justify-between items-center px-12'>
                <div className="text-xl md:text-3xl font-semibold text-white">
                    ExZork Shop
                </div>
                {isAuthenticated ? (
                    incomeData?.data && (
                        <div className="text-white text-right">
                            <div className="text-sm text-gray-300">Total Income</div>
                            <div className="text-xl font-semibold">
                                {formatCurrency(incomeData.data.reduce((sum, game) => sum + game.total_income, 0))}
                            </div>
                            <div className="text-sm text-gray-300">
                                {incomeData.data.reduce((sum, game) => sum + game.total_sold, 0).toLocaleString()} accounts sold
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-white text-right">
                        <div className="text-sm text-gray-300">Total Transaction</div>
                        <div className="text-xl font-semibold">
                            {formatCurrency(totalRevenue)}
                        </div>
                        <div className="text-sm text-gray-300">
                            {totalSold.toLocaleString()} accounts sold
                        </div>
                    </div>
                )}
            </div>
            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-gray-500 text-lg">Loading games...</div>
                    </div>
                ) : !games || games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Games Available</h3>
                        <p className="text-gray-500 text-center max-w-md">
                            There are currently no games available in the shop. Please check back later.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => {
                            const gameStats = salesStats?.find(stat => stat.game_id === game.id);
                            return (
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
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Total Transaction:</span>
                                                <span className="font-semibold text-gray-800">
                                                    {formatCurrency(gameStats?.total_revenue ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-1">
                                                <span className="text-gray-500">Accounts Sold:</span>
                                                <span className="font-semibold text-gray-800">
                                                    {(gameStats?.total_sold ?? 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
} 