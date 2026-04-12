import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 pt-16">
                <Sidebar />
                <main className="flex-1 lg:ml-64 p-6">
                    <div className="max-w-6xl mx-auto">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};
