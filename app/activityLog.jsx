// import { ArrowLeft, Clock, Filter, Mail, MapPin, Phone, Search, Truck, User, Users } from 'lucide-react';
// import { useState } from 'react';

// const activityLog = () => {
//   const [currentView, setCurrentView] = useState('dashboard');
//   const [selectedPerson, setSelectedPerson] = useState(null);
//   const [selectedVehicle, setSelectedVehicle] = useState(null);
//   const [userType, setUserType] = useState('all');

//   // Sample data with Indian names and waste management roles
//   const workers = [
//     {
//       id: 1,
//       name: 'Rahul Sharma',
//       role: 'Swachh Worker',
//       avatar: '/api/placeholder/80/80',
//       completed: 45, // Feeder points completed
//       active: 3, // Currently active
//       phone: '+91 98765 43210',
//       email: 'rahul.sharma@swachh.com',
//       location: 'Kothrud, Pune',
//       attendance: 'Present',
//       wasteCollected: '125 kg',
//       feederPoints: 45,
//       wasteTypes: [
//         { type: 'Organic', quantity: '75 kg', percentage: 60 },
//         { type: 'Plastic', quantity: '25 kg', percentage: 20 },
//         { type: 'Paper', quantity: '15 kg', percentage: 12 },
//         { type: 'Metal', quantity: '10 kg', percentage: 8 }
//       ],
//       deliveries: [
//         { type: 'Collection', address: 'Feeder Point A-12, Kothrud', time: '6:30 AM', status: 'completed', waste: '15 kg' },
//         { type: 'Collection', address: 'Feeder Point B-8, Karve Nagar', time: '7:45 AM', status: 'completed', waste: '22 kg' },
//         { type: 'Collection', address: 'Feeder Point C-5, Warje', time: '9:15 AM', status: 'active', waste: '18 kg' },
//         { type: 'Collection', address: 'Feeder Point D-3, Bavdhan', time: '10:30 AM', status: 'pending', waste: 'TBD' }
//       ]
//     },
//     {
//       id: 2,
//       name: 'Priya Patil',
//       role: 'Driver',
//       avatar: '/api/placeholder/80/80',
//       completed: 28, // Total trips
//       active: 2, // Active trips
//       phone: '+91 87654 32109',
//       email: 'priya.patil@swachh.com',
//       location: 'Baner, Pune',
//       attendance: 'Present',
//       totalTrips: 28,
//       wasteCollected: '2.5 tons',
//       feederPointsCovered: 156,
//       routeHistory: 'View Route Map',
//       deliveries: [
//         { type: 'Route', address: 'Baner to Kothrud Collection Route', time: '6:00 AM', status: 'completed', waste: '350 kg' },
//         { type: 'Route', address: 'Warje to Bavdhan Collection Route', time: '10:30 AM', status: 'completed', waste: '280 kg' },
//         { type: 'Route', address: 'Viman Nagar Collection Route', time: '2:15 PM', status: 'active', waste: '195 kg' },
//         { type: 'Disposal', address: 'Waste Processing Center, Uruli', time: '4:30 PM', status: 'pending', waste: '825 kg' }
//       ]
//     },
//     {
//       id: 3,
//       name: 'Amit Joshi',
//       role: 'Helper',
//       avatar: '/api/placeholder/80/80',
//       completed: 32, // Trips assisted
//       active: 2,
//       phone: '+91 76543 21098',
//       email: 'amit.joshi@swachh.com',
//       location: 'Hadapsar, Pune',
//       attendance: 'Present',
//       tripsAssisted: 32,
//       wasteHandled: '1.8 tons',
//       feederPointsAssisted: 142,
//       routesCovered: 'View Coverage Map',
//       deliveries: [
//         { type: 'Assistance', address: 'Hadapsar Collection Route - Vehicle MH14AB1234', time: '6:30 AM', status: 'completed', waste: '290 kg' },
//         { type: 'Assistance', address: 'Magarpatta Collection Route - Vehicle MH14CD5678', time: '9:45 AM', status: 'completed', waste: '225 kg' },
//         { type: 'Assistance', address: 'Amanora Collection Route - Vehicle MH14AB1234', time: '1:30 PM', status: 'active', waste: '180 kg' },
//         { type: 'Loading', address: 'Transfer Station, Hadapsar', time: '4:00 PM', status: 'pending', waste: '695 kg' }
//       ]
//     },
//     {
//       id: 4,
//       name: 'Sunita Desai',
//       role: 'Supervisor',
//       avatar: '/api/placeholder/80/80',
//       completed: 18, // Tasks completed
//       active: 4, // Active supervisions
//       phone: '+91 65432 10987',
//       email: 'sunita.desai@swachh.com',
//       location: 'Shivaji Nagar, Pune',
//       attendance: 'Present',
//       feederPointsVisited: 18,
//       tasksCompleted: 15,
//       teamsSupervised: 4,
//       inspectionsToday: 6,
//       deliveries: [
//         { type: 'Inspection', address: 'Zone-A Feeder Points (Kothrud Area)', time: '7:00 AM', status: 'completed', waste: 'Quality Check' },
//         { type: 'Supervision', address: 'Collection Team-2 (Baner Route)', time: '9:30 AM', status: 'completed', waste: 'Route Monitoring' },
//         { type: 'Inspection', address: 'Zone-B Feeder Points (Warje Area)', time: '11:45 AM', status: 'active', waste: 'Ongoing Check' },
//         { type: 'Meeting', address: 'Regional Office, Shivaji Nagar', time: '2:00 PM', status: 'pending', waste: 'Team Review' }
//       ]
//     }
//   ];

//   const vehicles = [
//     {
//       id: 'MH-14-AB-1234',
//       driver: 'Priya Patil',
//       trips: [
//         { name: 'October 11', type: 'Collection', summary: 'Full Day Waste Collection - Baner Zone', status: 'completed', startTime: '6:00 AM', endTime: '2:00 PM', waste: '850 kg' },
//         { name: 'October 11', type: 'Disposal', summary: 'Transfer to Processing Center', status: 'completed', startTime: '2:30 PM', endTime: '4:00 PM', waste: '850 kg' },
//         { name: 'October 12', type: 'Collection', summary: 'Kothrud-Warje Collection Route', status: 'active', startTime: '6:15 AM', endTime: 'Ongoing', waste: '640 kg' },
//         { name: 'October 12', type: 'Collection', summary: 'Bavdhan Area Collection', status: 'pending', startTime: '10:30 AM', endTime: 'Scheduled', waste: 'TBD' },
//         { name: 'October 15', type: 'Collection', summary: 'Viman Nagar Full Route Coverage', status: 'scheduled', startTime: '6:00 AM', endTime: 'Scheduled', waste: 'Estimated 900 kg' }
//       ]
//     }
//   ];

//   const filteredWorkers = userType === 'all' ? workers : workers.filter(worker => 
//     worker.role.toLowerCase().replace(' ', '').includes(userType.toLowerCase().replace(' ', ''))
//   );

//   const Dashboard = () => (
//     <div className="bg-white min-h-screen">
//       {/* Header */}
//       <div className="bg-blue-800 text-white p-4">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-semibold">Swachh Activity Monitor</h1>
//           <div className="text-sm">9:41</div>
//         </div>
//       </div>

//       {/* Filter Tabs */}
//       <div className="bg-white shadow-sm p-4">
//         <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
//           {['all', 'swachh worker', 'driver', 'helper', 'supervisor'].map((type) => (
//             <button
//               key={type}
//               onClick={() => setUserType(type)}
//               className={`flex-1 py-2 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
//                 userType === type
//                   ? 'bg-white text-blue-800 shadow-sm'
//                   : 'text-gray-600 hover:text-gray-800'
//               }`}
//             >
//               {type === 'all' ? 'All Users' : type}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Workers List */}
//       <div className="p-4 space-y-3">
//         {filteredWorkers.map((worker) => (
//           <div
//             key={worker.id}
//             onClick={() => {
//               setSelectedPerson(worker);
//               setCurrentView('profile');
//             }}
//             className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
//           >
//             <div className="flex items-center space-x-4">
//               <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
//                 <User className="w-6 h-6 text-gray-600" />
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center space-x-2">
//                   <h3 className="font-semibold text-gray-900">{worker.name}</h3>
//                   <span className={`text-xs px-2 py-1 rounded-full ${
//                     worker.attendance === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                   }`}>
//                     {worker.attendance}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-600">{worker.role}</p>
//                 <p className="text-xs text-gray-500">{worker.location}</p>
//               </div>
//               <div className="text-right">
//                 <div className="flex space-x-4 text-sm">
//                   <div>
//                     <span className="font-semibold text-2xl text-gray-900">{worker.completed}</span>
//                     <p className="text-xs text-gray-500">
//                       {worker.role === 'Swachh Worker' ? 'Feeder Points' :
//                        worker.role === 'Driver' ? 'Trips' :
//                        worker.role === 'Helper' ? 'Assisted' : 'Tasks'}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-2xl text-blue-800">{worker.active}</span>
//                     <p className="text-xs text-gray-500">Active</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Vehicle History Button */}
//       <div className="p-4">
//         <button
//           onClick={() => {
//             setSelectedVehicle(vehicles[0]);
//             setCurrentView('trips');
//           }}
//           className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-900 transition-colors"
//         >
//           <Truck className="w-5 h-5" />
//           <span>View Vehicle History</span>
//         </button>
//       </div>
//     </div>
//   );

//   const ProfileView = () => (
//     <div className="bg-white min-h-screen">
//       {/* Header */}
//       <div className="bg-blue-800 text-white p-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <button onClick={() => setCurrentView('dashboard')}>
//               <ArrowLeft className="w-6 h-6" />
//             </button>
//             <h1 className="text-xl font-semibold">{selectedPerson?.role}</h1>
//           </div>
//           <div className="text-sm">9:41</div>
//         </div>
//       </div>

//       {/* Profile Info */}
//       <div className="p-4 bg-white">
//         <div className="flex items-start space-x-4">
//           <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
//             <User className="w-10 h-10 text-gray-600" />
//           </div>
//           <div className="flex-1">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="flex items-center space-x-2">
//                   <h2 className="text-lg font-semibold text-gray-900">{selectedPerson?.name}</h2>
//                   <span className={`text-xs px-2 py-1 rounded-full ${
//                     selectedPerson?.attendance === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                   }`}>
//                     {selectedPerson?.attendance}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-600 uppercase tracking-wide">{selectedPerson?.role}</p>
//               </div>
//               <button className="p-2">
//                 <div className="w-1 h-5 bg-gray-400 rounded-full"></div>
//               </button>
//             </div>
//             <div className="flex space-x-4 mt-3">
//               <button className="flex items-center space-x-2 text-gray-600">
//                 <Mail className="w-4 h-4" />
//                 <span className="text-sm">Email</span>
//               </button>
//               <button className="flex items-center space-x-2 text-gray-600">
//                 <Phone className="w-4 h-4" />
//                 <span className="text-sm">Call</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Role-specific Overview */}
//       <div className="p-4 bg-gray-50">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
//           <button className="text-blue-800 text-sm">See all</button>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           {selectedPerson?.role === 'Swachh Worker' && (
//             <>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Feeder Points</p>
//                 <p className="text-3xl font-bold text-gray-900">{selectedPerson?.feederPoints}</p>
//               </div>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Waste Collected</p>
//                 <p className="text-3xl font-bold text-blue-800">{selectedPerson?.wasteCollected}</p>
//               </div>
//             </>
//           )}
//           {selectedPerson?.role === 'Driver' && (
//             <>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Total Trips</p>
//                 <p className="text-3xl font-bold text-gray-900">{selectedPerson?.totalTrips}</p>
//               </div>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Waste Collected</p>
//                 <p className="text-3xl font-bold text-blue-800">{selectedPerson?.wasteCollected}</p>
//               </div>
//             </>
//           )}
//           {selectedPerson?.role === 'Helper' && (
//             <>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Trips Assisted</p>
//                 <p className="text-3xl font-bold text-gray-900">{selectedPerson?.tripsAssisted}</p>
//               </div>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Waste Handled</p>
//                 <p className="text-3xl font-bold text-blue-800">{selectedPerson?.wasteHandled}</p>
//               </div>
//             </>
//           )}
//           {selectedPerson?.role === 'Supervisor' && (
//             <>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Points Visited</p>
//                 <p className="text-3xl font-bold text-gray-900">{selectedPerson?.feederPointsVisited}</p>
//               </div>
//               <div className="bg-white rounded-lg p-4 text-center">
//                 <p className="text-sm text-gray-600">Tasks Done</p>
//                 <p className="text-3xl font-bold text-blue-800">{selectedPerson?.tasksCompleted}</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Waste Type Distribution for Swachh Worker */}
//       {selectedPerson?.role === 'Swachh Worker' && (
//         <div className="p-4 bg-white">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Type Distribution</h3>
//           <div className="space-y-3">
//             {selectedPerson?.wasteTypes?.map((waste, index) => (
//               <div key={index} className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <div className={`w-4 h-4 rounded-full ${
//                     waste.type === 'Organic' ? 'bg-green-500' :
//                     waste.type === 'Plastic' ? 'bg-red-500' :
//                     waste.type === 'Paper' ? 'bg-blue-500' : 'bg-gray-500'
//                   }`}></div>
//                   <span className="text-sm font-medium">{waste.type}</span>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-sm font-semibold">{waste.quantity}</span>
//                   <span className="text-xs text-gray-500 ml-2">({waste.percentage}%)</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Activities/Tasks */}
//       <div className="p-4">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">
//           {selectedPerson?.role === 'Swachh Worker' ? 'Collections' :
//            selectedPerson?.role === 'Driver' ? 'Routes' :
//            selectedPerson?.role === 'Helper' ? 'Assistance' : 'Tasks'}
//         </h3>
        
//         {/* Search */}
//         <div className="relative mb-4">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Search"
//             className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
//           />
//           <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//         </div>

//         {/* Activity List Headers */}
//         <div className="flex text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">
//           <div className="w-20">TYPE</div>
//           <div className="flex-1">LOCATION</div>
//         </div>

//         {/* Activity Items */}
//         <div className="space-y-3">
//           {selectedPerson?.deliveries.map((delivery, index) => (
//             <div key={index} className="flex items-center space-x-3 py-2">
//               <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
//                 {delivery.type === 'Collection' ? (
//                   <div className="w-4 h-4 bg-green-500 rounded-full"></div>
//                 ) : delivery.type === 'Route' ? (
//                   <Truck className="w-4 h-4 text-blue-600" />
//                 ) : delivery.type === 'Assistance' ? (
//                   <Users className="w-4 h-4 text-orange-500" />
//                 ) : (
//                   <div className="w-4 h-4 bg-purple-500 rounded-sm"></div>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-medium text-gray-900">{delivery.type}</span>
//                   <span className={`text-xs px-2 py-1 rounded-full ${
//                     delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
//                     delivery.status === 'active' ? 'bg-blue-100 text-blue-800' :
//                     'bg-gray-100 text-gray-600'
//                   }`}>
//                     {delivery.status}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-600">{delivery.address}</p>
//                 <div className="flex items-center justify-between mt-1">
//                   <p className="text-xs text-gray-500">{delivery.time}</p>
//                   <p className="text-xs text-blue-600 font-medium">{delivery.waste}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   const TripsView = () => (
//     <div className="bg-white min-h-screen">
//       {/* Header */}
//       <div className="bg-white p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <button onClick={() => setCurrentView('dashboard')}>
//               <ArrowLeft className="w-6 h-6 text-gray-600" />
//             </button>
//             <h1 className="text-xl font-semibold text-gray-900">Vehicle History</h1>
//           </div>
//           <div className="text-sm text-gray-600">9:41</div>
//         </div>
//       </div>

//       {/* Map Area */}
//       <div className="h-64 bg-gray-200 relative">
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="text-gray-500 text-center">
//             <MapPin className="w-12 h-12 mx-auto mb-2" />
//             <p className="text-sm">Route Coverage Map</p>
//             <p className="text-xs">Kothrud • Baner • Warje • Bavdhan</p>
//           </div>
//         </div>
//         {/* Mock route pins */}
//         <div className="absolute top-12 left-16 w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center">
//           <div className="w-2 h-2 bg-white rounded-full"></div>
//         </div>
//         <div className="absolute top-20 right-20 w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center">
//           <div className="w-2 h-2 bg-white rounded-full"></div>
//         </div>
//         <div className="absolute bottom-16 left-12 w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center">
//           <div className="w-2 h-2 bg-white rounded-full"></div>
//         </div>
//       </div>

//       {/* Trips Section */}
//       <div className="p-4">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">Collection History</h3>
//         </div>

//         {/* Search */}
//         <div className="relative mb-4">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Search"
//             className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
//           />
//           <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//         </div>

//         {/* Trip List Headers */}
//         <div className="flex text-xs text-gray-500 uppercase tracking-wide mb-2 px-2">
//           <div className="w-24">DATE</div>
//           <div className="w-20">TYPE</div>
//           <div className="flex-1">ROUTE/SUMMARY</div>
//         </div>

//         {/* Trip Items */}
//         <div className="space-y-3">
//           {selectedVehicle?.trips.map((trip, index) => (
//             <div key={index} className="flex items-center space-x-3 py-3 border-b border-gray-100">
//               <div className="w-8 h-8 flex items-center justify-center">
//                 {trip.status === 'completed' ? (
//                   <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
//                     <div className="w-2 h-2 bg-white rounded-full"></div>
//                   </div>
//                 ) : trip.status === 'active' ? (
//                   <Clock className="w-6 h-6 text-orange-500" />
//                 ) : trip.type === 'Collection' ? (
//                   <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
//                     <Truck className="w-4 h-4 text-gray-600" />
//                   </div>
//                 ) : (
//                   <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
//                     <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
//                   </div>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-4">
//                       <span className="text-sm font-medium text-gray-900 w-20">{trip.name}</span>
//                       <span className="text-sm text-gray-600 w-16">{trip.type}</span>
//                       <span className="text-sm text-gray-800 flex-1">{trip.summary}</span>
//                     </div>
//                     <div className="flex items-center justify-between mt-1">
//                       <span className="text-xs text-gray-500">{trip.startTime} - {trip.endTime}</span>
//                       <span className="text-xs text-blue-600 font-medium">{trip.waste}</span>
//                     </div>
//                     <span className={`text-xs px-2 py-1 rounded-full ${
//                       trip.status === 'completed' ? 'bg-green-100 text-green-800' :
//                       trip.status === 'active' ? 'bg-orange-100 text-orange-800' :
//                       trip.status === 'pending' ? 'bg-blue-100 text-blue-800' :
//                       'bg-gray-100 text-gray-600'
//                     }`}>
//                       {trip.status}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   // Render based on current view
//   return (
//     <div className="max-w-sm mx-auto bg-gray-100 min-h-screen">
//       {currentView === 'dashboard' && <Dashboard />}
//       {currentView === 'profile' && <ProfileView />}
//       {currentView === 'trips' && <TripsView />}
//     </div>
//   );
// };

// export default activityLog;


import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ActivityLogApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [userType, setUserType] = useState('all');

  // Sample data with Indian names and waste management roles
  const workers = [
    {
      id: 1,
      name: 'Rahul Sharma',
      role: 'Swachh Worker',
      completed: 5,
      active: 3,
      phone: '+91 98765 43210',
      email: 'rahul.sharma@swachh.com',
      location: 'Kothrud, Pune',
      attendance: 'Present',
      wasteCollected: '125 kg',
      feederPoints: 5,
      wasteTypes: [
        { type: 'Organic', quantity: '75 kg', percentage: 60 },
        { type: 'Plastic', quantity: '25 kg', percentage: 20 },
        { type: 'Paper', quantity: '15 kg', percentage: 12 },
        { type: 'Metal', quantity: '10 kg', percentage: 8 }
      ],
      deliveries: [
        { type: 'Collection', address: 'Feeder Point A-12, Kothrud', time: '6:30 AM', status: 'completed', waste: '15 kg' },
        { type: 'Collection', address: 'Feeder Point B-8, Karve Nagar', time: '7:45 AM', status: 'completed', waste: '22 kg' },
        { type: 'Collection', address: 'Feeder Point C-5, Warje', time: '9:15 AM', status: 'active', waste: '18 kg' },
        { type: 'Collection', address: 'Feeder Point D-3, Bavdhan', time: '10:30 AM', status: 'pending', waste: 'TBD' }
      ]
    },
    {
      id: 2,
      name: 'Priya Patil',
      role: 'Driver',
      completed: 8,
      active: 2,
      phone: '+91 87654 32109',
      email: 'priya.patil@swachh.com',
      location: 'Baner, Pune',
      attendance: 'Present',
      totalTrips: 3,
      wasteCollected: '..... kg / tons',
      feederPointsCovered: 156,
      deliveries: [
        { type: 'Route', address: 'Baner to Kothrud Collection Route', time: '6:00 AM', status: 'completed', waste: '350 kg' },
        { type: 'Route', address: 'Warje to Bavdhan Collection Route', time: '10:30 AM', status: 'completed', waste: '280 kg' },
        { type: 'Route', address: 'Viman Nagar Collection Route', time: '2:15 PM', status: 'active', waste: '195 kg' },
        { type: 'Disposal', address: 'Waste Processing Center, Uruli', time: '4:30 PM', status: 'pending', waste: '825 kg' }
      ]
    },
    {
      id: 3,
      name: 'Amit Joshi',
      role: 'Helper',
      completed: 4,
      active: 2,
      phone: '+91 76543 21098',
      email: 'amit.joshi@swachh.com',
      location: 'Hadapsar, Pune',
      attendance: 'Present',
      tripsAssisted: 2,
      wasteHandled: '1 tons',
      feederPointsAssisted: 142,
      deliveries: [
        { type: 'Assistance', address: 'Hadapsar Collection Route - Vehicle MH14AB1234', time: '6:30 AM', status: 'completed', waste: '290 kg' },
        { type: 'Assistance', address: 'Magarpatta Collection Route - Vehicle MH14CD5678', time: '9:45 AM', status: 'completed', waste: '225 kg' },
        { type: 'Assistance', address: 'Amanora Collection Route - Vehicle MH14AB1234', time: '1:30 PM', status: 'active', waste: '180 kg' },
        { type: 'Loading', address: 'Transfer Station, Hadapsar', time: '4:00 PM', status: 'pending', waste: '695 kg' }
      ]
    },
    {
      id: 4,
      name: 'Sunita Desai',
      role: 'Supervisor',
      completed: 8,
      active: 4,
      phone: '+91 65432 10987',
      email: 'sunita.desai@swachh.com',
      location: 'Shivaji Nagar, Pune',
      attendance: 'Present',
      feederPointsVisited: 8,
      tasksCompleted: 15,
      teamsSupervised: 4,
      inspectionsToday: 6,
      deliveries: [
        { type: 'Inspection', address: 'Zone-A Feeder Points (Kothrud Area)', time: '7:00 AM', status: 'completed', waste: 'Quality Check' },
        { type: 'Supervision', address: 'Collection Team-2 (Baner Route)', time: '9:30 AM', status: 'completed', waste: 'Route Monitoring' },
        { type: 'Inspection', address: 'Zone-B Feeder Points (Warje Area)', time: '11:45 AM', status: 'active', waste: 'Ongoing Check' },
        { type: 'Meeting', address: 'Regional Office, Shivaji Nagar', time: '2:00 PM', status: 'pending', waste: 'Team Review' }
      ]
    }
  ];

  const vehicles = [
    {
      id: 'MH-14-AB-1234',
      driver: 'Priya Patil',
      trips: [
        { name: 'October 11', type: 'Collection', summary: 'Full Day Waste Collection - Baner Zone', status: 'completed', startTime: '6:00 AM', endTime: '2:00 PM', waste: '850 kg' },
        { name: 'October 11', type: 'Disposal', summary: 'Transfer to Processing Center', status: 'completed', startTime: '2:30 PM', endTime: '4:00 PM', waste: '850 kg' },
        { name: 'October 12', type: 'Collection', summary: 'Kothrud-Warje Collection Route', status: 'active', startTime: '6:15 AM', endTime: 'Ongoing', waste: '640 kg' },
        { name: 'October 12', type: 'Collection', summary: 'Bavdhan Area Collection', status: 'pending', startTime: '10:30 AM', endTime: 'Scheduled', waste: 'TBD' },
        { name: 'October 15', type: 'Collection', summary: 'Viman Nagar Full Route Coverage', status: 'scheduled', startTime: '6:00 AM', endTime: 'Scheduled', waste: 'Estimated 900 kg' }
      ]
    }
  ];

  const filteredWorkers = userType === 'all' ? workers : workers.filter(worker => 
    worker.role.toLowerCase().replace(' ', '').includes(userType.toLowerCase().replace(' ', ''))
  );

  const Dashboard = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Swachh Activity Monitor</Text>
        <Text style={styles.timeText}>9:41</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsContainer}>
          {['all', 'swachh worker', 'driver', 'helper', 'supervisor'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setUserType(type)}
              style={[
                styles.filterTab,
                userType === type && styles.activeFilterTab
              ]}
            >
              <Text style={[
                styles.filterTabText,
                userType === type ? styles.activeFilterTabText : styles.inactiveFilterTabText
              ]}>
                {type === 'all' ? 'All Users' : type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Workers List */}
      <ScrollView style={styles.workersList}>
        {filteredWorkers.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            onPress={() => {
              setSelectedPerson(worker);
              setCurrentView('profile');
            }}
            style={styles.workerCard}
          >
            <View style={styles.workerCardContent}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#6b7280" />
              </View>
              <View style={styles.workerInfo}>
                <View style={styles.workerNameRow}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <View style={[
                    styles.attendanceBadge,
                    worker.attendance === 'Present' ? styles.presentBadge : styles.absentBadge
                  ]}>
                    <Text style={[
                      styles.attendanceText,
                      worker.attendance === 'Present' ? styles.presentText : styles.absentText
                    ]}>
                      {worker.attendance}
                    </Text>
                  </View>
                </View>
                <Text style={styles.workerRole}>{worker.role}</Text>
                <Text style={styles.workerLocation}>{worker.location}</Text>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{worker.completed}</Text>
                  <Text style={styles.statLabel}>
                    {worker.role === 'Swachh Worker' ? 'Feeder Points' :
                     worker.role === 'Driver' ? 'Trips' :
                     worker.role === 'Helper' ? 'Assisted' : 'Tasks'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.activeStatNumber]}>{worker.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Vehicle History Button */}
        <TouchableOpacity
          onPress={() => {
            setSelectedVehicle(vehicles[0]);
            setCurrentView('trips');
          }}
          style={styles.vehicleButton}
        >
          <Ionicons name="car" size={20} color="#ffffff" />
          <Text style={styles.vehicleButtonText}>View Vehicle History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const ProfileView = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setCurrentView('dashboard')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{selectedPerson?.role}</Text>
        </View>
        <Text style={styles.timeText}>9:41</Text>
      </View>

      <ScrollView>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.profileContent}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={40} color="#6b7280" />
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.profileNameRow}>
                <View>
                  <View style={styles.workerNameRow}>
                    <Text style={styles.profileName}>{selectedPerson?.name}</Text>
                    <View style={[
                      styles.attendanceBadge,
                      selectedPerson?.attendance === 'Present' ? styles.presentBadge : styles.absentBadge
                    ]}>
                      <Text style={[
                        styles.attendanceText,
                        selectedPerson?.attendance === 'Present' ? styles.presentText : styles.absentText
                      ]}>
                        {selectedPerson?.attendance}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.profileRole}>{selectedPerson?.role}</Text>
                </View>
              </View>
              <View style={styles.contactButtons}>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="mail" size={16} color="#6b7280" />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="call" size={16} color="#6b7280" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Role-specific Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.overviewGrid}>
            {selectedPerson?.role === 'Swachh Worker' && (
              <>
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewLabel}>Feeder Points</Text>
                  <Text style={styles.overviewValue}>{selectedPerson?.feederPoints}</Text>
                </View>
                <View style={[styles.overviewCard, styles.lastOverviewCard]}>
                  <Text style={styles.overviewLabel}>Waste Collected</Text>
                  <Text style={[styles.overviewValue, styles.overviewActiveValue]}>{selectedPerson?.wasteCollected}</Text>
                </View>
              </>
            )}
            {selectedPerson?.role === 'Driver' && (
              <>
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewLabel}>Total Trips</Text>
                  <Text style={styles.overviewValue}>{selectedPerson?.totalTrips}</Text>
                </View>
                <View style={[styles.overviewCard, styles.lastOverviewCard]}>
                  <Text style={styles.overviewLabel}>Waste Collected</Text>
                  <Text style={[styles.overviewValue, styles.overviewActiveValue]}>{selectedPerson?.wasteCollected}</Text>
                </View>
              </>
            )}
            {selectedPerson?.role === 'Helper' && (
              <>
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewLabel}>Trips Assisted</Text>
                  <Text style={styles.overviewValue}>{selectedPerson?.tripsAssisted}</Text>
                </View>
                <View style={[styles.overviewCard, styles.lastOverviewCard]}>
                  <Text style={styles.overviewLabel}>Waste Handled</Text>
                  <Text style={[styles.overviewValue, styles.overviewActiveValue]}>{selectedPerson?.wasteHandled}</Text>
                </View>
              </>
            )}
            {selectedPerson?.role === 'Supervisor' && (
              <>
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewLabel}>Points Visited</Text>
                  <Text style={styles.overviewValue}>{selectedPerson?.feederPointsVisited}</Text>
                </View>
                <View style={[styles.overviewCard, styles.lastOverviewCard]}>
                  <Text style={styles.overviewLabel}>Tasks Done</Text>
                  <Text style={[styles.overviewValue, styles.overviewActiveValue]}>{selectedPerson?.tasksCompleted}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Waste Type Distribution for Swachh Worker */}
        {selectedPerson?.role === 'Swachh Worker' && (
          <View style={styles.wasteTypesSection}>
            <Text style={styles.sectionTitle}>Waste Type Distribution</Text>
            <View style={styles.wasteTypesContainer}>
              {selectedPerson?.wasteTypes?.map((waste, index) => (
                <View key={index} style={styles.wasteTypeItem}>
                  <View style={styles.wasteTypeLeft}>
                    <View style={[
                      styles.wasteTypeIndicator,
                      {
                        backgroundColor: 
                          waste.type === 'Organic' ? '#10b981' :
                          waste.type === 'Plastic' ? '#ef4444' :
                          waste.type === 'Paper' ? '#3b82f6' : '#6b7280'
                      }
                    ]} />
                    <Text style={styles.wasteTypeName}>{waste.type}</Text>
                  </View>
                  <View style={styles.wasteTypeRight}>
                    <Text style={styles.wasteTypeQuantity}>{waste.quantity}</Text>
                    <Text style={styles.wasteTypePercentage}>({waste.percentage}%)</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Activities/Tasks */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>
            {selectedPerson?.role === 'Swachh Worker' ? 'Collections' :
             selectedPerson?.role === 'Driver' ? 'Routes' :
             selectedPerson?.role === 'Helper' ? 'Assistance' : 'Tasks'}
          </Text>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              style={styles.searchInput}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Activity List Headers */}
          <View style={styles.listHeaders}>
            <Text style={[styles.headerTextSmall, styles.typeHeader]}>TYPE</Text>
            <Text style={[styles.headerTextSmall, styles.addressHeader]}>LOCATION</Text>
          </View>

          {/* Activity Items */}
          {selectedPerson?.deliveries.map((delivery, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                {delivery.type === 'Collection' ? (
                  <View style={styles.collectionIcon} />
                ) : delivery.type === 'Route' ? (
                  <Ionicons name="car" size={16} color="#3b82f6" />
                ) : delivery.type === 'Assistance' ? (
                  <Ionicons name="people" size={16} color="#f59e0b" />
                ) : (
                  <View style={styles.inspectionIcon} />
                )}
              </View>
              <View style={styles.activityDetails}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityType}>{delivery.type}</Text>
                  <View style={[
                    styles.statusBadge,
                    delivery.status === 'completed' ? styles.completedBadge :
                    delivery.status === 'active' ? styles.activeBadge : styles.pendingBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      delivery.status === 'completed' ? styles.completedText :
                      delivery.status === 'active' ? styles.activeText : styles.pendingText
                    ]}>
                      {delivery.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityAddress}>{delivery.address}</Text>
                <View style={styles.activityFooter}>
                  <Text style={styles.activityTime}>{delivery.time}</Text>
                  <Text style={styles.activityWaste}>{delivery.waste}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const TripsView = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setCurrentView('dashboard')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Vehicle History</Text>
        </View>
        <Text style={styles.timeText}>9:41</Text>
      </View>

      <ScrollView>
        {/* Map Area */}
        <View style={styles.mapArea}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={48} color="#9ca3af" style={styles.mapIcon} />
            <Text style={styles.mapText}>Route Coverage Map</Text>
            <Text style={styles.mapSubtext}>Kothrud • Baner • Warje • Bavdhan</Text>
          </View>
          {/* Mock route pins */}
          <View style={[styles.routePin, styles.routePin1]} />
          <View style={[styles.routePin, styles.routePin2]} />
          <View style={[styles.routePin, styles.routePin3]} />
        </View>

        {/* Trips Section */}
        <View style={styles.tripsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collection History</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              style={styles.searchInput}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Trip List Headers */}
          <View style={styles.listHeaders}>
            <Text style={[styles.headerTextSmall, styles.dateHeader]}>DATE</Text>
            <Text style={[styles.headerTextSmall, styles.typeHeader]}>TYPE</Text>
            <Text style={[styles.headerTextSmall, styles.summaryHeader]}>ROUTE/SUMMARY</Text>
          </View>

          {/* Trip Items */}
          {selectedVehicle?.trips.map((trip, index) => (
            <View key={index} style={styles.tripItem}>
              <View style={styles.tripIcon}>
                {trip.status === 'completed' ? (
                  <View style={styles.completedTripIcon}>
                    <View style={styles.completedTripDot} />
                  </View>
                ) : trip.status === 'active' ? (
                  <Ionicons name="time" size={24} color="#f59e0b" />
                ) : trip.type === 'Collection' ? (
                  <View style={styles.collectionTripIcon}>
                    <Ionicons name="car" size={16} color="#6b7280" />
                  </View>
                ) : (
                  <View style={styles.disposalTripIcon}>
                    <View style={styles.disposalTripDot} />
                  </View>
                )}
              </View>
              <View style={styles.tripDetails}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDate}>{trip.name}</Text>
                  <Text style={styles.tripType}>{trip.type}</Text>
                  <Text style={styles.tripSummary}>{trip.summary}</Text>
                </View>
                <View style={styles.tripFooter}>
                  <Text style={styles.tripTime}>{trip.startTime} - {trip.endTime}</Text>
                  <Text style={styles.tripWaste}>{trip.waste}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  trip.status === 'completed' ? styles.completedBadge :
                  trip.status === 'active' ? styles.activeBadge :
                  trip.status === 'pending' ? styles.activeBadge : styles.pendingBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    trip.status === 'completed' ? styles.completedText :
                    trip.status === 'active' ? styles.activeText :
                    trip.status === 'pending' ? styles.activeText : styles.pendingText
                  ]}>
                    {trip.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Render based on current view
  if (currentView === 'dashboard') return <Dashboard />;
  if (currentView === 'profile') return <ProfileView />;
  if (currentView === 'trips') return <TripsView />;
  
  return <Dashboard />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeText: {
    fontSize: 14,
    color: '#ffffff',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabsContainer: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  activeFilterTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeFilterTabText: {
    color: '#1e40af',
  },
  inactiveFilterTabText: {
    color: '#6b7280',
  },
  workersList: {
    padding: 16,
  },
  workerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  workerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#d1d5db',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  presentBadge: {
    backgroundColor: '#dcfce7',
  },
  absentBadge: {
    backgroundColor: '#fee2e2',
  },
  attendanceText: {
    fontSize: 10,
    fontWeight: '500',
  },
  presentText: {
    color: '#166534',
  },
  absentText: {
    color: '#dc2626',
  },
  workerRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  workerLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  activeStatNumber: {
    color: '#1e40af',
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  vehicleButton: {
    backgroundColor: '#1e40af',
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  mapArea: {
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapIcon: {
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mapSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  routePin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routePin1: {
    top: 40,
    left: 50,
    backgroundColor: '#1e40af',
  },
  routePin2: {
    top: 100,
    left: 150,
    backgroundColor: '#1e40af',
  },
  routePin3: {
    top: 160,
    left: 80,
    backgroundColor: '#1e40af',
  },
  tripsSection: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateHeader: {
    width: '24%',
  },
  typeHeader: {
    width: '20%',
  },
  summaryHeader: {
    width: '56%',
  },  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripIcon: {
    width: '12%',
    marginRight: 16,
  },
  completedTripIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTripDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  activeTripIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionTripIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disposalTripIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripDetails: {
    flex: 1,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tripType: {
    fontSize: 12,
    color: '#6b7280',
  },
  tripSummary: {
    fontSize: 12,
    color: '#111827',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tripWaste: {
    fontSize: 12,
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  activeBadge: {
    backgroundColor: '#fee2e2',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
  },
  completedText: {
    color: '#166534',
  },
  activeText: {
    color: '#f59e0b',
  },
  pendingText: {
    color: '#dc2626',
  },
});

export default ActivityLogApp;