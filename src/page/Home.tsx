import { Link } from "react-router-dom";
import { useGetGamesQuery, useGetIncomeQuery, useGetSalesStatsQuery } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Image } from "../components/Image";

export default function HomePage() {
    const { data: games, isLoading } = useGetGamesQuery();
    const { data: incomeData } = useGetIncomeQuery();
    const { data: salesStats } = useGetSalesStatsQuery();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const totalRevenue = salesStats?.reduce((sum, stat) => sum + stat.total_revenue, 0) ?? 0;
    const totalSold = salesStats?.reduce((sum, stat) => sum + stat.total_sold, 0) ?? 0;

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (isLoading || !games) {
        return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className='bg-gray-900 dark:bg-gray-800 h-[10vh] flex justify-between items-center px-12'>
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
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.map((game) => {
                        const gameStats = salesStats?.find(stat => stat.game_id === game.id);
                        const gameIncome = isAuthenticated ? incomeData?.data?.find(income => income.game_id === game.id) : null;
                        return (
                            <Link 
                                key={game.id} 
                                to={`/games/${game.id}`}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="aspect-video relative">
                                    <Image 
                                        src={game.image} 
                                        alt={game.name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{game.name}</h2>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {game.servers.map((server, index) => (
                                            <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">
                                                {server.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {isAuthenticated ? 'Your Income:' : 'Total Transaction:'}
                                            </span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                {formatCurrency(isAuthenticated ? (gameIncome?.total_income ?? 0) : (gameStats?.total_revenue ?? 0))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-gray-500 dark:text-gray-400">Accounts Sold:</span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                {(isAuthenticated ? (gameIncome?.total_sold ?? 0) : (gameStats?.total_sold ?? 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
} 