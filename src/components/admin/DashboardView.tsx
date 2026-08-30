import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Flame,
  Award,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export const DashboardView: React.FC = () => {
  const { orders, menuItems, tables } = useRestaurant();

  // Metrics Calculations
  const validOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = validOrders.length;
  const averageTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;

  // Best selling calculation
  const itemSalesMap: Record<string, { name: string; count: number; revenue: number; image: string }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((it) => {
      if (!itemSalesMap[it.menuItem.id]) {
        itemSalesMap[it.menuItem.id] = {
          name: it.menuItem.name,
          count: 0,
          revenue: 0,
          image: it.menuItem.image,
        };
      }
      itemSalesMap[it.menuItem.id].count += it.quantity;
      itemSalesMap[it.menuItem.id].revenue += it.itemTotal;
    });
  });

  const topSellers = Object.values(itemSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Hourly distribution simulation
  const hourlyData = [
    { hour: '11:00', sales: 1200 },
    { hour: '12:00', sales: 3450 },
    { hour: '13:00', sales: 4200 },
    { hour: '14:00', sales: 1800 },
    { hour: '17:00', sales: 2900 },
    { hour: '18:00', sales: 5800 },
    { hour: '19:00', sales: 7400 },
    { hour: '20:00', sales: 6100 },
    { hour: '21:00', sales: 3200 },
  ];

  const maxHourly = Math.max(...hourlyData.map((d) => d.sales));

  return (
    <div id="admin-dashboard-view" className="space-y-8 pb-12">
      
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Revenue */}
        <div className="p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="label-caps">
              ยอดขายวันนี้ (Revenue)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              ฿{totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.4% จากเมื่อวาน</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="label-caps">
              จำนวนออเดอร์ (Total Orders)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {totalOrdersCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>{orders.filter((o) => o.orderType === 'dine_in').length} ทานที่ร้าน / {orders.filter((o) => o.orderType === 'pickup').length} รับกลับ</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Order Value */}
        <div className="p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="label-caps">
              ยอดเฉลี่ยต่อบิล (Avg Ticket)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              ฿{averageTicket.toLocaleString()}
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">
              เฉลี่ย 3.2 รายการ/บิล
            </div>
          </div>
        </div>

        {/* Metric 4: Table Occupancy */}
        <div className="p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="label-caps">
              การครองโต๊ะ (Occupancy)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {occupiedTables} / {tables.length} โต๊ะ
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">
              อัตราว่าง {Math.round(((tables.length - occupiedTables) / tables.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Hourly Sales Activity Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-black text-base text-white uppercase tracking-wider">ยอดขายตามช่วงเวลา (Peak Hours)</h4>
              <p className="text-xs text-stone-400 font-medium">สถิติปริมาณยอดขายช่วงกลางวัน & ค่ำ</p>
            </div>
            <span className="text-[10px] font-mono font-black uppercase px-3 py-1 rounded-lg bg-[#0A0A0B] text-[#FF5C00] border border-white/10">
              ช่วงพีค 19:00 น.
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="h-64 flex items-end justify-between gap-2 pt-8">
            {hourlyData.map((d, i) => {
              const heightPercent = Math.round((d.sales / maxHourly) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono text-[#FF5C00] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    ฿{d.sales}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="w-full rounded-xl bg-[#FF5C00] group-hover:bg-[#FF7729] transition-all cursor-pointer shadow-md"
                  />
                  <span className="text-[10px] font-mono text-stone-400 font-bold">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best Selling Dishes */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#111112] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="font-display font-black text-base text-white flex items-center gap-2 uppercase tracking-wider">
              <Flame className="w-5 h-5 text-[#FF5C00]" />
              <span>5 เมนูขายดีที่สุด</span>
            </h4>
            <span className="text-xs text-stone-400 font-bold uppercase text-[10px]">RANKED BY SALES</span>
          </div>

          <div className="space-y-3">
            {topSellers.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0A0A0B] border border-white/10 hover:border-[#FF5C00]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                    idx === 0 ? 'bg-[#FF5C00] text-white' : 'bg-[#161618] text-stone-400 border border-white/10'
                  }`}>
                    {idx + 1}
                  </div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{item.name}</h5>
                    <p className="text-[11px] text-stone-400 font-medium">ขายได้ {item.count} ที่</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-[#FF5C00] text-xs">
                    ฿{item.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
