package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 *
 * @author Michał Gnatowski
 * @date 25 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

@Entity
@Table(name = "general_settings")
@NamedQueries({
    @NamedQuery(name = "GeneralSettings.findAll", query = "SELECT g FROM GeneralSettings g"),
    @NamedQuery(name = "GeneralSettings.findById", query = "SELECT g FROM GeneralSettings g WHERE g.id = :id"),
    @NamedQuery(name = "GeneralSettings.findByKey1", query = "SELECT g FROM GeneralSettings g WHERE g.key1 = :key1"),
    @NamedQuery(name = "GeneralSettings.findByValue1", query = "SELECT g FROM GeneralSettings g WHERE g.value1 = :value1")})
public class GeneralSettings implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 32)
    @Column(name = "key1")
    private String key1;
    @Size(max = 100)
    @Column(name = "value1")
    private String value1;

    public GeneralSettings() {
    }

    public GeneralSettings(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getKey1() {
        return key1;
    }

    public void setKey1(String key1) {
        this.key1 = key1;
    }

    public String getValue1() {
        return value1;
    }

    public void setValue1(String value1) {
        this.value1 = value1;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof GeneralSettings)) {
            return false;
        }
        GeneralSettings other = (GeneralSettings) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.GeneralSettings[ id=" + id + " ]";
    }

}
