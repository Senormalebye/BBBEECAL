import React, { useState } from 'react';

const Yes4YouthInitiative = ({ onClose, onSubmit }) => {
  const occupationalLevels = [
    'Executive Management',
    'Other Executive Management',
    'Senior Management',
    'Middle Management',
    'Junior Management',
    'Other, Semi-Skilled & Unskilled'
  ];

  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    siteLocation: '',
    idNumber: '',
    jobTitle: '',
    race: '',
    gender: '',
    occupationalLevel: '',
    hostEmployerYear: '',
    monthlyStipend: 0,
    startDate: '',
    endDate: '',
    isCurrentYesEmployee: false,
    isCompletedYesAbsorbed: false
  });

  const [yesData, setYesData] = useState({
    totalParticipants: 0,
    blackYouthParticipants: 0,
    totalStipendPaid: 0,
    currentYesEmployees: 0,
    completedYesAbsorbed: 0
  });

  const handleParticipantChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewParticipant({
      ...newParticipant,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.idNumber || !newParticipant.jobTitle || !newParticipant.startDate) {
      alert('Please fill in the Name, ID Number, Job Title, and Start Date.');
      return;
    }

    setParticipants([...participants, newParticipant]);
    setNewParticipant({
      name: '',
      siteLocation: '',
      idNumber: '',
      jobTitle: '',
      race: '',
      gender: '',
      occupationalLevel: '',
hostEmployerYear: '',
      monthlyStipend: 0,
      startDate: '',
      endDate: '',
      isCurrentYesEmployee: false,
      isCompletedYesAbsorbed: false
    });

    recalculateYesData([...participants, newParticipant]);
  };

  const recalculateYesData = (updatedParticipants) => {
    let totalParticipants = updatedParticipants.length;
    let blackYouthParticipants = 0;
    let totalStipendPaid = 0;
    let currentYesEmployees = 0;
    let completedYesAbsorbed = 0;

    updatedParticipants.forEach((participant) => {
      if (participant.race.toLowerCase() === 'black') {
        blackYouthParticipants += 1; // Assuming YES focuses on black youth
      }
      totalStipendPaid += Number(participant.monthlyStipend);
      if (participant.isCurrentYesEmployee) {
        currentYesEmployees += 1;
      }
      if (participant.isCompletedYesAbsorbed) {
        completedYesAbsorbed += 1;
      }
    });

    setYesData({
      totalParticipants,
      blackYouthParticipants,
      totalStipendPaid,
      currentYesEmployees,
      completedYesAbsorbed
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ participants, yesData });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Yes 4 Youth Initiative Details</h2>

        <form onSubmit={handleSubmit}>
          {/* Participant Input Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add YES Participant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name & Surname</label>
                <input
                  type="text"
                  name="name"
                  value={newParticipant.name}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter name & surname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newParticipant.siteLocation}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  value={newParticipant.idNumber}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter ID number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={newParticipant.jobTitle}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Race</label>
                <select
                  name="race"
                  value={newParticipant.race}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Race</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                  <option value="Coloured">Coloured</option>
                  <option value="Indian">Indian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={newParticipant.gender}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Occupational Level</label>
                <select
                  name="occupationalLevel"
                  value={newParticipant.occupationalLevel}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Occupational Level</option>
                  {occupationalLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Host Employer / Year</label>
                <input
                  type="text"
                  name="hostEmployerYear"
                  value={newParticipant.hostEmployerYear}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter host employer/year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Stipend (R)</label>
                <input
                  type="number"
                  name="monthlyStipend"
                  value={newParticipant.monthlyStipend}
                  onChange={handleParticipantChange}
                  min="0"
                  className="w-full p-2 border rounded"
                  placeholder="Enter monthly stipend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={newParticipant.startDate}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={newParticipant.endDate}
                  onChange={handleParticipantChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isCurrentYesEmployee"
                  checked={newParticipant.isCurrentYesEmployee}
                  onChange={handleParticipantChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Current YES Employee</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isCompletedYesAbsorbed"
                  checked={newParticipant.isCompletedYesAbsorbed}
                  onChange={handleParticipantChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Completed YES Absorbed</label>
              </div>
            </div>
            <button
              type="button"
              onClick={addParticipant}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Participant
            </button>
          </div>

          {/* Participants Table */}
          {participants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">YES Participants List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Name & Surname</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">ID Number</th>
                      <th className="border border-gray-300 px-4 py-2">Job Title</th>
                      <th className="border border-gray-300 px-4 py-2">Race</th>
                      <th className="border border-gray-300 px-4 py-2">Gender</th>
                      <th className="border border-gray-300 px-4 py-2">Occupational Level</th>
                      <th className="border border-gray-300 px-4 py-2">Host Employer / Year</th>
                      <th className="border border-gray-300 px-4 py-2">Monthly Stipend (R)</th>
                      <th className="border border-gray-300 px-4 py-2">Start Date</th>
                      <th className="border border-gray-300 px-4 py-2">End Date</th>
                      <th className="border border-gray-300 px-4 py-2">Current YES Employee</th>
                      <th className="border border-gray-300 px-4 py-2">Completed YES Absorbed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{participant.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.siteLocation}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.idNumber}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.jobTitle}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.race}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.gender}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.occupationalLevel}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.hostEmployerYear}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.monthlyStipend}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.startDate}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.endDate || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.isCurrentYesEmployee ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{participant.isCompletedYesAbsorbed ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aggregated YES Data */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Yes 4 Youth Initiative Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Participants</label>
                <input
                  type="number"
                  value={yesData.totalParticipants}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Youth Participants</label>
                <input
                  type="number"
                  value={yesData.blackYouthParticipants}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Stipend Paid (R)</label>
                <input
                  type="number"
                  value={yesData.totalStipendPaid}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current YES Employees</label>
                <input
                  type="number"
                  value={yesData.currentYesEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Completed YES Absorbed</label>
                <input
                  type="number"
                  value={yesData.completedYesAbsorbed}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="fixed bottom-20 right-4 flex justify-end gap-4 bg-white p-4 rounded-md shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Ownership Details
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Yes4YouthInitiative;