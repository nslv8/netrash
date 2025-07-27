import { Layout } from "@/components/layout/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SquarePlus } from "lucide-react";
import useFetchStable from "@/hooks/useFetchStable";
import { useCookies } from "react-cookie";
import { getIdUserCookies, isRoleAdmin } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import NasabahDataTable from "@/components/nasabah/nasabah-data-table";
import CustomButton from "@/components/custom_ui/custom-button";
import Link from "next/link";
import SearchInput from "@/components/custom_ui/search-input";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function Nasabah() {
  const [cookies, setCookie, removeCookie] = useCookies(["currentUser"]);
  let userId = getIdUserCookies(cookies);
  const isAdmin = isRoleAdmin(cookies);

  console.log("=== NASABAH PAGE INIT ===");
  console.log("Raw userId:", userId);
  console.log("Is Admin:", isAdmin);
  console.log("Cookies:", cookies.currentUser);

  if (isAdmin) {
    userId = "";
  }

  // Pastikan userId valid sebelum membuat request
  const requestBody = userId
    ? {
        idBsu: parseInt(userId),
      }
    : null;

  console.log("Request will be made with:", requestBody);

  const {
    data: dataNasabah,
    error: errorNasabah,
    isLoading: isLoadingNasabah,
  } = useFetchStable(
    requestBody ? "/api/bsu/nasabah/getNasabah" : null, // Skip request jika tidak ada userId
    requestBody
      ? {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      : null
  );

  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    console.log("=== NASABAH DEBUG INFO ===");
    console.log("User ID:", userId);
    console.log("Data Nasabah:", dataNasabah);
    console.log("Error Nasabah:", errorNasabah);
    console.log("Loading Nasabah:", isLoadingNasabah);
    console.log("Request body:", {
      idBsu: parseInt(getIdUserCookies(cookies)),
    });

    if (errorNasabah) {
      console.error("Error details:", errorNasabah);
      toast({
        variant: "destructive",
        title: "Gagal!",
        description:
          errorNasabah.message || "Terjadi kesalahan saat memuat data nasabah",
      });
    }

    if (search) {
      const filteredData = dataNasabah?.data?.filter((item) => {
        const lowerCaseSearch = search.toLowerCase();
        return (
          item.nama.toLowerCase().includes(lowerCaseSearch) ||
          item.Nik.toLowerCase().includes(lowerCaseSearch) ||
          // item.saldo.toString().includes(search) ||
          item.totalTransaksi.toString().includes(search) ||
          item.saldo.toString().includes(search) ||
          item.bsu.nama.toLowerCase().includes(lowerCaseSearch)
        );
      });
      setFiltered(filteredData);
    } else {
      setFiltered(dataNasabah?.data ?? []);
    }
  }, [search, dataNasabah, errorNasabah, isLoadingNasabah, userId]);

  if (errorNasabah) {
    console.error("Error in nasabah page:", errorNasabah);
  }
  return (
    <Layout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/monitoring/bsu">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Daftar Nasabah</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Daftar Nasabah</CardTitle>
        </CardHeader>

        <CardContent>
          <>
            <div className="flex my-3 justify-end space-x-2">
              <Link
                href={"/nasabah/add-nasabah?id=" + userId}
                className="ml-auto"
              >
                <CustomButton type="button">
                  <SquarePlus className="w-4 h-4 mr-2" /> Tambah
                </CustomButton>
              </Link>
              <SearchInput className={"ml-5"} onChange={handleSearch} />
            </div>
            {!requestBody ? (
              <div className="text-center py-8">
                <p>User ID tidak ditemukan. Silakan login ulang.</p>
              </div>
            ) : isLoadingNasabah ? (
              <div className="text-center py-8">
                <p>Memuat data nasabah...</p>
              </div>
            ) : errorNasabah ? (
              <div className="text-center py-8 text-red-500">
                <p>
                  Error: {errorNasabah.message || "Gagal memuat data nasabah"}
                </p>
                <p className="text-sm mt-2">
                  Periksa console untuk detail lebih lanjut
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <p>Tidak ada nasabah yang terdaftar untuk BSU ini.</p>
              </div>
            ) : (
              <>
                <ScrollArea className="border rounded-md h-[calc(100vh-200px)]">
                  <NasabahDataTable data={filtered} />
                </ScrollArea>
              </>
            )}
          </>
        </CardContent>
      </Card>
      <Toaster />
    </Layout>
  );
}

export default Nasabah;
