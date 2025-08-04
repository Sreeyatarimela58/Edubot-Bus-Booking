import React, { useEffect, useState } from "react";
import { adminService } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

const BusScheduleSummary = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllBuses();
  }, []);

  const fetchAllBuses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminService.getBuses();
      
      if (data && Array.isArray(data)) {
        setBuses(data);
      } else if (data && data.buses && Array.isArray(data.buses)) {
        setBuses(data.buses);
      } else {
        setBuses([]);
        console.error("Unexpected data format for all buses:", data);
      }
    } catch (err) {
      console.error("Error fetching all buses:", err);
      setError(err.response?.data?.message || "Failed to fetch buses");
    } finally {
      setLoading(false);
    }
  };

  // Group buses by route (from-to)
  const busRoutes = buses.reduce((routes, bus) => {
    const routeKey = `${bus.from}-${bus.to}`;
    if (!routes[routeKey]) {
      routes[routeKey] = [];
    }
    routes[routeKey].push(bus);
    return routes;
  }, {});

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-3 bg-gray-100">
        <h2 className="text-xl font-semibold text-gray-700">Bus Schedule Summary</h2>
      </div>
      <div className="p-4">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-blue-500">{error}</div>
        ) : (
          <div className="space-y-6">
            {Object.keys(busRoutes).length === 0 ? (
              <p className="text-gray-500">No buses found</p>
            ) : (
              Object.entries(busRoutes).map(([route, busList]) => {
                const [from, to] = route.split('-');
                return (
                  <div key={route} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {from} to {to}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                            <th className="py-2 px-4 text-left">Bus Name</th>
                            <th className="py-2 px-4 text-left">Type</th>
                            <th className="py-2 px-4 text-left">Departure</th>
                            <th className="py-2 px-4 text-left">Arrival</th>
                            <th className="py-2 px-4 text-left">Fare</th>
                            <th className="py-2 px-4 text-left">Running Days</th>
                            <th className="py-2 px-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm">
                          {busList.map((bus) => (
                            <tr key={bus._id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-2 px-4">{bus.name}</td>
                              <td className="py-2 px-4">{bus.type}</td>
                              <td className="py-2 px-4">{bus.departureTime}</td>
                              <td className="py-2 px-4">{bus.arrivalTime}</td>
                              <td className="py-2 px-4">₹{bus.fare}</td>
                              <td className="py-2 px-4">
                                {bus.runsOnAllDays ? (
                                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Daily</span>
                                ) : bus.runningDays && bus.runningDays.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {bus.runningDays.map(day => (
                                      <span key={day} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                        {day.substring(0, 3)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                    {new Date(bus.date).toLocaleDateString('en-US', {weekday: 'short'})}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${bus.isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {bus.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusScheduleSummary;