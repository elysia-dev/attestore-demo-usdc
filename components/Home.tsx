"use client";

import type React from "react";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issueData } from "../data";
import { BASE_URL } from "@/constant";

export default function Home() {
  const [issueDate, setIssueDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // 날짜 형식을 YYYY-MM-DD로 변환
      const formattedDate = issueDate.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );

      const response = await axios.post(
        `${BASE_URL}/api/generate-receipt`,
        {
          issuedDate: formattedDate,
          issueNumber: certificateNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data);
      console.log("API Response:", response.data);
    } catch (error) {
      console.error("API Error:", error);
      setResult({ error: "API 호출 중 오류가 발생했습니다." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDataSelect = (data: {
    issueDate: string;
    certificateNumber: string;
  }) => {
    setIssueDate(data.issueDate);
    setCertificateNumber(data.certificateNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-12">
            송금인증 ZK Proof 생성
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label
                htmlFor="issueDate"
                className="text-lg font-medium text-gray-700"
              >
                발급일자
              </Label>
              <Input
                id="issueDate"
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="증명서 발급일자를 입력하세요. (예: 20250618)"
                className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="certificateNumber"
                className="text-lg font-medium text-gray-700"
              >
                증명서 발급번호
              </Label>
              <Input
                id="certificateNumber"
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="증명서 발급번호를 입력해주세요."
                className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
              />
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-lg px-8 py-4 rounded-lg h-auto"
                disabled={!issueDate || !certificateNumber || isLoading}
              >
                {isLoading ? "생성 중..." : "ZK Proof 생성"}
              </Button>
            </div>
          </form>

          {/* Result Section */}
          {result && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                API 응답 결과
              </h3>
              <pre className="bg-white p-4 rounded border text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Data Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            테스트 데이터
          </h2>
          <p className="text-gray-600 mb-6">
            아래 데이터를 클릭하여 폼에 자동으로 입력할 수 있습니다.
          </p>

          <div className="grid gap-4">
            {issueData.map(
              (
                data: { issueDate: string; certificateNumber: string },
                index: number
              ) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTestDataSelect(data)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        발급일자: {data.issueDate}
                      </p>
                      <p className="text-gray-600">
                        증명서 발급번호: {data.certificateNumber}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestDataSelect(data);
                      }}
                    >
                      선택
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
