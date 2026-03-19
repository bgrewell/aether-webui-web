import { Server, Cpu, HardDrive, Network } from 'lucide-react';

export default function DeploymentInfrastructure() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deploy</h1>
        <p className="text-sm text-gray-600 mt-1">
          Deploy and manage 5G components including SD-Core, srsRAN, and subscriber simulators
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-intel-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-intel-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Nodes</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total vCPUs</p>
              <p className="text-2xl font-bold text-gray-900">96</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Memory</p>
              <p className="text-2xl font-bold text-gray-900">384 GB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Infrastructure Nodes</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            {
              name: 'node-01',
              roles: ['control-plane', 'worker'],
              cpu: 'Intel Xeon Gold 6330',
              cores: 32,
              memory: '128 GB',
              cpuUsage: 24,
              memUsage: 42,
            },
            {
              name: 'node-02',
              roles: ['worker'],
              cpu: 'Intel Xeon Gold 6330',
              cores: 32,
              memory: '128 GB',
              cpuUsage: 18,
              memUsage: 35,
            },
            {
              name: 'node-03',
              roles: ['worker'],
              cpu: 'Intel Xeon Gold 6330',
              cores: 32,
              memory: '128 GB',
              cpuUsage: 22,
              memUsage: 38,
            },
          ].map((node) => (
            <div key={node.name} className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
                  <div className="flex gap-2 mt-2">
                    {node.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-1 bg-intel-100 text-intel-700 text-xs font-medium rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">CPU</p>
                    <p className="text-sm font-medium text-gray-900">{node.cpu}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Cores</p>
                    <p className="text-sm font-medium text-gray-900">{node.cores}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Memory</p>
                    <p className="text-sm font-medium text-gray-900">{node.memory}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Network</p>
                    <p className="text-sm font-medium text-gray-900">10 Gbps</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">CPU Usage</span>
                      <span className="text-xs font-medium text-gray-900">{node.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-intel-600 h-2 rounded-full transition-all"
                        style={{ width: `${node.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Memory Usage</span>
                      <span className="text-xs font-medium text-gray-900">{node.memUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${node.memUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
