"use client";
import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { Weth_abi } from "./Weth_abi";
import { abi } from "./abi";

const poolAddress = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export default function AaveApp() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: allowance } = useReadContract({
    address: wethAddress,
    abi: Weth_abi,
    functionName: "allowance",
    args: [address, poolAddress],
  });

  const [ethAmount, setEthAmount] = useState("");
  const [aaveAmount, setAaveAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txHash, setTxHash] = useState(null);
  const [activeTab, setActiveTab] = useState("wrap");

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleWrapETH = async () => {
    if (!address) return alert("Please connect your wallet first");
    if (!ethAmount || isNaN(Number(ethAmount)) || Number(ethAmount) <= 0)
      return alert("Please enter a valid ETH amount");

    try {
      setLoading(true);
      const txHash = await writeContractAsync({
        address: wethAddress,
        abi: Weth_abi,
        functionName: "deposit",
        value: parseEther(ethAmount),
        gasLimit: BigInt(3000000),
      });

      setTxHash(txHash);
      setTransactions((prev) => [...prev, { type: "Wrap ETH", amount: ethAmount, hash: txHash }]);
    } catch (error) {
      console.error("Error:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveIfNeeded = async (amount) => {
    if (!allowance || BigInt(allowance) < parseEther(amount)) {
      const txHash = await writeContractAsync({
        address: wethAddress,
        abi: Weth_abi,
        functionName: "approve",
        args: [poolAddress, parseEther(amount)],
        gasLimit: BigInt(3000000),
      });
      setTxHash(txHash);
    }
  };

  const handleSupply = async () => {
    if (!address) return alert("Please connect your wallet first");
    if (!aaveAmount || isNaN(Number(aaveAmount)) || Number(aaveAmount) <= 0)
      return alert("Please enter a valid amount");

    try {
      setLoading(true);
      await handleApproveIfNeeded(aaveAmount);
      const txHash = await writeContractAsync({
        address: poolAddress,
        abi: abi,
        functionName: "supply",
        args: [wethAddress, parseEther(aaveAmount), address, 0],
        gasLimit: BigInt(3000000),
      });

      setTxHash(txHash);
      setTransactions((prev) => [...prev, { type: "Supply", amount: aaveAmount, hash: txHash }]);
    } catch (error) {
      console.error("Error:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address) return alert("Please connect your wallet first");
    if (!aaveAmount || isNaN(Number(aaveAmount)) || Number(aaveAmount) <= 0)
      return alert("Please enter a valid amount");

    try {
      setLoading(true);
      const txHash = await writeContractAsync({
        address: poolAddress,
        abi: abi,
        functionName: "withdraw",
        args: [wethAddress, parseEther(aaveAmount), address],
        gasLimit: BigInt(3000000),
      });

      setTxHash(txHash);
      setTransactions((prev) => [...prev, { type: "Withdraw", amount: aaveAmount, hash: txHash }]);
    } catch (error) {
      console.error("Error:", error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-700 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">WETH & Aave Manager</h1>
          <ConnectKitButton />
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("wrap")}
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === "wrap" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400 hover:text-white"
              }`}
            >
              Wrap ETH
            </button>
            <button
              onClick={() => setActiveTab("aave")}
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === "aave" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400 hover:text-white"
              }`}
            >
              Aave Actions
            </button>
          </div>

          {/* Wrap ETH Section */}
          {activeTab === "wrap" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-300 mb-1">
                  ETH Amount
                </label>
                <input
                  id="ethAmount"
                  type="text"
                  placeholder="0.0"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleWrapETH}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  loading ? "bg-indigo-800 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Wrap ETH to WETH"
                )}
              </button>
            </div>
          )}

          {/* Aave Actions Section */}
          {activeTab === "aave" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="aaveAmount" className="block text-sm font-medium text-gray-300 mb-1">
                  WETH Amount
                </label>
                <input
                  id="aaveAmount"
                  type="text"
                  placeholder="0.0"
                  value={aaveAmount}
                  onChange={(e) => setAaveAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSupply}
                  disabled={loading}
                  className={`py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    loading ? "bg-green-800 cursor-not-allowed" : "bg-green-700 hover:bg-green-600"
                  }`}
                >
                  {loading ? "..." : "Supply"}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className={`py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    loading ? "bg-red-800 cursor-not-allowed" : "bg-red-700 hover:bg-red-600"
                  }`}
                >
                  {loading ? "..." : "Withdraw"}
                </button>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-white mb-3">Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No transactions yet</p>
            ) : (
              <ul className="space-y-2">
                {transactions.map((tx, index) => (
                  <li key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div>
                      <span className="font-medium text-white">{tx.type}</span>
                      <span className="block text-sm text-gray-300">{tx.amount} WETH</span>
                    </div>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {receipt && (
          <div className="bg-green-900 px-6 py-3 text-sm text-green-300">
            Transaction confirmed!
          </div>
        )}
      </div>
    </div>
  );
}