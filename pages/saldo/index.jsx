
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useFetch from "@/hooks/useFetch";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import SaldoDataTable from "@/components/saldo/saldo-data-table";
import CustomButton from "@/components/custom_ui/custom-button";

import CustomCard from "@/components/custom_ui/custom-card";
import SearchInput from "@/components/custom_ui/search-input";
import Link from "next/link";
import { SquarePlus, Upload, FilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function getServerSideProps(context) {
  // Mengambil id dari query
  const idBsu = context.query.id;

  return {
    props: {
      idBsu,
    },
  };
}

function Saldo() {
  // Mengambil data menggunakan hook useFetch jika diperlukan
  const {
    data: dataKeuangan,
    error: errorKeuangan,
    isLoading: isLoadingKeuangan,
  } = useFetch(`/api/bsu/saldo`); // Endpoint ini bisa disesuaikan

  if (errorKeuangan) {
    toast({
      variant: "destructive",
      title: "Gagal!",
      description: errorKeuangan.message,
    });
  }

  return (
    <Layout>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Laporan Saldo Nasabah</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <CustomCard
              title="Sisa Saldo"
              value="10.000" //panggil data dari db
            />
            <CustomCard
              title="Total Pemasukkan"
              value="30.000" //panggil data dari db
            />
            <CustomCard
              title="Total Pengeluaran"
              value="20.000" //panggil data dari db
            />
          </div>
        </CardContent>
        <CardContent>
          <div className="flex my-3 justify-between">
            <Button variant="outline" className="ml-3">
              <FilterIcon className="w-4 h-4 mr-2" /> {/* Ikon Filter */}
              Filter
            </Button>
            <div className="flex my-3">
              <Link
                href={"/saldo/add-penarikan-saldo?"}
                className="ml-auto"
              >
                <CustomButton type="button">
                  <Upload className="w-4 h-4 mr-2" /> Penarikan Saldo
                </CustomButton>
              </Link>
              <SearchInput/>
            </div>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
            }}
          >
            {isLoadingKeuangan ? (
              <p>Loading...</p>
            ) : (
              // Panggilan data ke tabel keuangan
              <SaldoDataTable data={dataKeuangan || []} />
            )}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </Layout>
  );
}

export default Saldo;
