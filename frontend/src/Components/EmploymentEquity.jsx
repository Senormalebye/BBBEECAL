import React, { useState } from 'react';

const EmploymentEquity = ({ onClose, onSubmit }) => {
  const occupationalLevels = [
    'Executive Management',
    'Other Executive Management',
    'Senior Management',
    'Middle Management',
    'Junior Management',
    'Other, Semi-Skilled & Unskilled'
  ];

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    siteLocation: '',
    idNumber: '',
    jobTitle: '',
    race: '',
    gender: '',
    isDisabled: false,
    descriptionOfDisability: '',
    isForeign: false,
    occupationalLevel: '',
    grossMonthlySalary: 0
  });

  const [employmentData, setEmploymentData] = useState({
    totalEmployees: 0,
    blackEmployees: 0,
    blackFemaleEmployees: 0,
    disabledEmployees: 0,
    foreignEmployees: 0,
    byOccupationalLevel: occupationalLevels.reduce((acc, level) => {
      acc[level] = {
        total: 0,
        black: 0,
        blackFemale: 0,
        disabled: 0
      };
      return acc;
    }, {})
  });

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.idNumber || !newEmployee.jobTitle || !newEmployee.occupationalLevel) {
      alert('Please fill in the Name, ID Number, Job Title, and Occupational Level.');
      return;
    }

    setEmployees([...employees, newEmployee]);
    setNewEmployee({
      name: '',
      siteLocation: '',
      idNumber: '',
      jobTitle: '',
      race: '',
      gender: '',
      isDisabled: false,
      descriptionOfDisability: '',
      isForeign: false,
      occupationalLevel: '',
      grossMonthlySalary: 0
    });

    recalculateEmploymentData([...employees, newEmployee]);
  };

  const recalculateEmploymentData = (updatedEmployees) => {
    let totalEmployees = updatedEmployees.length;
    let blackEmployees = 0;
    let blackFemaleEmployees = 0;
    let disabledEmployees = 0;
    let foreignEmployees = 0;

    // Initialize breakdown by occupational level
    const byOccupationalLevel = occupationalLevels.reduce((acc, level) => {
      acc[level] = {
        total: 0,
        black: 0,
        blackFemale: 0,
        disabled: 0
      };
      return acc;
    }, {});

    updatedEmployees.forEach((employee) => {
      const level = employee.occupationalLevel;

      // Increment total for the occupational level
      byOccupationalLevel[level].total += 1;

      // Check for black employees
      if (employee.race.toLowerCase() === 'black') {
        blackEmployees += 1;
        byOccupationalLevel[level].black += 1;

        // Check for black female employees
        if (employee.gender.toLowerCase() === 'female') {
          blackFemaleEmployees += 1;
          byOccupationalLevel[level].blackFemale += 1;
        }
      }

      // Check for disabled employees
      if (employee.isDisabled) {
        disabledEmployees += 1;
        byOccupationalLevel[level].disabled += 1;
      }

      // Check for foreign employees
      if (employee.isForeign) {
        foreignEmployees += 1;
      }
    });

    setEmploymentData({
      totalEmployees,
      blackEmployees,
      blackFemaleEmployees,
      disabledEmployees,
      foreignEmployees,
      byOccupationalLevel
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ employees, employmentData });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Employment Equity Details</h2>

        <form onSubmit={handleSubmit}>
          {/* Employee Input Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add Employee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name & Surname</label>
                <input
                  type="text"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter name & surname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newEmployee.siteLocation}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  value={newEmployee.idNumber}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter ID number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={newEmployee.jobTitle}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Race</label>
                <select
                  name="race"
                  value={newEmployee.race}
                  onChange={handleEmployeeChange}
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
                  value={newEmployee.gender}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDisabled"
                  checked={newEmployee.isDisabled}
                  onChange={handleEmployeeChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Disabled</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description of Disability</label>
                <input
                  type="text"
                  name="descriptionOfDisability"
                  value={newEmployee.descriptionOfDisability}
                  onChange={handleEmployeeChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter description of disability"
                  disabled={!newEmployee.isDisabled}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isForeign"
                  checked={newEmployee.isForeign}
                  onChange={handleEmployeeChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Foreign</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Occupational Level</label>
                <select
                  name="occupationalLevel"
                  value={newEmployee.occupationalLevel}
                  onChange={handleEmployeeChange}
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
                <label className="block text-sm font-medium mb-1">Gross Monthly Salary (R)</label>
                <input
                  type="number"
                  name="grossMonthlySalary"
                  value={newEmployee.grossMonthlySalary}
                  onChange={handleEmployeeChange}
                  min="0"
                  className="w-full p-2 border rounded"
                  placeholder="Enter gross monthly salary"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addEmployee}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Employee
            </button>
          </div>

          {/* Employees Table */}
          {employees.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Employees List</h3>
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
                      <th className="border border-gray-300 px-4 py-2">Disabled</th>
                      <th className="border border-gray-300 px-4 py-2">Description of Disability</th>
                      <th className="border border-gray-300 px-4 py-2">Foreign</th>
                      <th className="border border-gray-300 px-4 py-2">Occupational Level</th>
                      <th className="border border-gray-300 px-4 py-2">Gross Monthly Salary (R)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{employee.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.siteLocation}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.idNumber}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.jobTitle}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.race}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.gender}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.isDisabled ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.descriptionOfDisability}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.isForeign ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.occupationalLevel}</td>
                        <td className="border border-gray-300 px-4 py-2">{employee.grossMonthlySalary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aggregated Employment Data */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Employment Equity Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Employees</label>
                <input
                  type="number"
                  value={employmentData.totalEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Employees</label>
                <input
                  type="number"
                  value={employmentData.blackEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Female Employees</label>
                <input
                  type="number"
                  value={employmentData.blackFemaleEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disabled Employees</label>
                <input
                  type="number"
                  value={employmentData.disabledEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Foreign Employees</label>
                <input
                  type="number"
                  value={employmentData.foreignEmployees}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
            </div>

            {/* Breakdown by Occupational Level */}
            <h4 className="text-md font-medium mb-2">Breakdown by Occupational Level</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-4 py-2">Occupational Level</th>
                    <th className="border border-gray-300 px-4 py-2">Total Employees</th>
                    <th className="border border-gray-300 px-4 py-2">Black Employees</th>
                    <th className="border border-gray-300 px-4 py-2">Black Female Employees</th>
                    <th className="border border-gray-300 px-4 py-2">Employees with Disabilities</th>
                  </tr>
                </thead>
                <tbody>
                  {occupationalLevels.map((level) => (
                    <tr key={level}>
                      <td className="border border-gray-300 px-4 py-2">{level}</td>
                      <td className="border border-gray-300 px-4 py-2">{employmentData.byOccupationalLevel[level].total}</td>
                      <td className="border border-gray-300 px-4 py-2">{employmentData.byOccupationalLevel[level].black}</td>
                      <td className="border border-gray-300 px-4 py-2">{employmentData.byOccupationalLevel[level].blackFemale}</td>
                      <td className="border border-gray-300 px-4 py-2">{employmentData.byOccupationalLevel[level].disabled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default EmploymentEquity;