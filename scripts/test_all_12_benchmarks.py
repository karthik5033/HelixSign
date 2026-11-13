import json
import urllib.request
import urllib.error
from pathlib import Path
from Bio.Seq import Seq

ROOT = Path(__file__).resolve().parent.parent
TEST_DIR = ROOT / "test_sequences"
BACKEND_URL = "http://localhost:3001"

def read_fasta(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    header = ""
    seq = ""
    for line in lines:
        line = line.strip()
        if line.startswith(">"):
            header = line[1:]
        else:
            seq += line
    return header, seq.upper()

def post_json(endpoint, payload):
    url = f"{BACKEND_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, {"error": err_body}
    except Exception as e:
        return 500, {"error": str(e)}

def main():
    manifest_path = TEST_DIR / "manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"=== TESTING {len(manifest)} BENCHMARK CONSTRUCTS AGAINST LIVE SERVICES ===")
    
    # 1. Health check
    req = urllib.request.Request(f"{BACKEND_URL}/health")
    with urllib.request.urlopen(req, timeout=5) as res:
        print(f"Backend /health status: {res.status}")
    
    req_api = urllib.request.Request(f"{BACKEND_URL}/api/health")
    with urllib.request.urlopen(req_api, timeout=5) as res:
        health_data = json.loads(res.read().decode("utf-8"))
        print(f"Backend /api/health status: {res.status}, ML Connected: {health_data.get('mlServiceConnected')}")

    passed = 0
    failed = 0

    for idx, item in enumerate(manifest, 1):
        filename = item["filename"]
        file_path = TEST_DIR / filename
        header, seq = read_fasta(file_path)
        
        print(f"\n[{idx}/12] Testing: {filename} ({len(seq)} bp, {len(seq)//3} codons)")
        
        # Test STAMP
        stamp_payload = {
            "ownerName": "ApexBio Laboratory",
            "projectName": f"Bench-{item['gene']}",
            "batchName": "B-2026-VAL",
            "sequence": seq,
            "host": "E. coli K-12",
            "geneName": item["gene"]
        }
        status, stamp_res = post_json("/api/stamp", stamp_payload)
        if status != 200 or "data" not in stamp_res:
            print(f"  ❌ STAMP FAILED: status={status}, res={stamp_res}")
            failed += 1
            continue

        stamped_seq = stamp_res["data"]["stampedSequence"]
        protein_id = stamp_res["data"].get("proteinIdentityPercent", 0.0)
        mut_count = stamp_res["data"].get("mutationsApplied") or len(stamp_res["data"].get("mutations", []))

        # In-silico biological translation check (Table 11)
        orig_pep = str(Seq(seq).translate(table=11))
        stamp_pep = str(Seq(stamped_seq).translate(table=11))
        is_pep_identical = (orig_pep == stamp_pep)
        
        print(f"  ✓ STAMP: mutations={mut_count}, proteinIdentity={protein_id}%, inSilicoPeptideMatch={is_pep_identical}")
        if not is_pep_identical:
            print(f"  ❌ PROTEIN DIVERGENCE DETECTED!")
            failed += 1
            continue

        # Test VERIFY
        verify_payload = {
            "sequence": stamped_seq,
        }
        v_status, v_res = post_json("/api/verify", verify_payload)
        if v_status != 200 or "data" not in v_res:
            print(f"  ❌ VERIFY FAILED: status={v_status}, res={v_res}")
            failed += 1
            continue

        v_data = v_res["data"]
        is_verified = (v_res.get("status") == "verified") or (v_data.get("verified") is True) or (v_data.get("status") == "verified")
        conf = v_data.get("confidenceScore", 0.0)
        print(f"  ✓ VERIFY: verified={is_verified}, confidence={conf}, owner={v_data.get('owner')}")

        # Test STEALTH
        stealth_payload = {
            "sequence": stamped_seq,
        }
        s_status, s_res = post_json("/api/stealth", stealth_payload)
        if s_status != 200 or "data" not in s_res:
            print(f"  ❌ STEALTH FAILED: status={s_status}, res={s_res}")
            failed += 1
            continue

        s_data = s_res["data"]
        print(f"  ✓ STEALTH: kmerProb={s_data.get('kmerProbability')}, cnnProb={s_data.get('cnnProbability')}")

        # Test ATTACK (Synonymous shuffle)
        attack_payload = {
            "sequence": stamped_seq,
            "attackType": "shuffle_synonymous",
            "intensity": 0.05
        }
        atk_status, atk_res = post_json("/api/attack", attack_payload)
        if atk_status != 200 or "data" not in atk_res:
            print(f"  ❌ ATTACK FAILED: status={atk_status}, res={atk_res}")
            failed += 1
            continue
        print(f"  ✓ ATTACK: survived={atk_res['data'].get('watermarkSurvived')}, proteinIntact={atk_res['data'].get('proteinIntact')}")

        # Test STRESS (Channel noise simulation)
        stress_payload = {
            "sequence": stamped_seq,
            "substitutionRate": 0.01,
            "trials": 3
        }
        str_status, str_res = post_json("/api/stress", stress_payload)
        if str_status != 200 or "data" not in str_res:
            print(f"  ❌ STRESS FAILED: status={str_status}, res={str_res}")
            failed += 1
            continue
        print(f"  ✓ STRESS: trials={str_res['data'].get('trials')}, recoveryRate={str_res['data'].get('recoveryRate')}%")

        # Test TRACE (Forensic provenance recovery)
        trace_payload = {
            "suspectSequence": stamped_seq
        }
        trc_status, trc_res = post_json("/api/trace", trace_payload)
        if trc_status != 200 or "data" not in trc_res:
            print(f"  ❌ TRACE FAILED: status={trc_status}, res={trc_res}")
            failed += 1
            continue
        matches = trc_res["data"].get("candidateMatches", [])
        print(f"  ✓ TRACE: candidateMatches={len(matches)}")

        passed += 1

    # Test Registry Listing
    reg_req = urllib.request.Request(f"{BACKEND_URL}/api/registry?limit=15")
    with urllib.request.urlopen(reg_req, timeout=5) as res:
        reg_data = json.loads(res.read().decode("utf-8"))
        stamps_count = len(reg_data.get("data", {}).get("stamps", reg_data.get("stamps", [])))
        print(f"\n✓ REGISTRY GET: {stamps_count} registered stamps retrieved")

    print("\n" + "="*50)
    print(f"FINAL RESULT: {passed}/12 PASSED, {failed} FAILED")
    print("="*50)

if __name__ == "__main__":
    main()
